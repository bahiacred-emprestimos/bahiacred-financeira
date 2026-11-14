// Adaptador: mantém a mesma API que o sistema usava (db.collection(x).doc(y).set/get/update/delete/onSnapshot)
// e guarda tudo numa única tabela "docs" no Supabase (col, id, data jsonb).
(function () {
  var cfg = window.BAHIA_CONFIG || {};
  if (!window.supabase || !cfg.supabaseUrl || cfg.supabaseUrl.indexOf('COLE_AQUI') === 0) {
    console.error('Supabase não configurado: preencha js/config.js');
    return;
  }
  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  var listeners = {}; // coleção -> [fn]

  function split(path) {
    var p = String(path).split('/');
    return { col: p[0], id: p.slice(1).join('/') };
  }
  function snapCol(col) {
    return sb.from('docs').select('id,data').eq('col', col).then(function (r) {
      if (r.error) throw r.error;
      return (r.data || []).map(function (row) {
        return { id: row.id, data: function () { return row.data; } };
      });
    });
  }
  function notify(col) {
    (listeners[col] || []).forEach(function (fn) {
      snapCol(col).then(function (docs) { fn({ docs: docs }); })
        .catch(function (e) { console.error(e); });
    });
  }
  // Atualização em tempo real: quando qualquer linha muda, recarrega a coleção afetada
  sb.channel('docs-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'docs' }, function (payload) {
      var row = payload.new || payload.old || {};
      if (row.col) notify(row.col);
    })
    .subscribe();

  function docRef(col, id) {
    return {
      id: id,
      set: function (obj) {
        return sb.from('docs').upsert({ col: col, id: id, data: obj, updated_at: new Date().toISOString() })
          .then(function (r) { if (r.error) throw r.error; });
      },
      update: function (obj) {
        return this.get().then(function (d) {
          var merged = Object.assign({}, d.exists ? d.data() : {}, obj);
          return docRef(col, id).set(merged);
        });
      },
      delete: function () {
        return sb.from('docs').delete().eq('col', col).eq('id', id)
          .then(function (r) { if (r.error) throw r.error; });
      },
      get: function () {
        return sb.from('docs').select('data').eq('col', col).eq('id', id).maybeSingle()
          .then(function (r) {
            if (r.error) throw r.error;
            var row = r.data;
            return { exists: !!row, data: function () { return row ? row.data : undefined; } };
          });
      },
      onSnapshot: function (cb, onErr) {
        var fn = function (s) {
          var d = (s.docs || []).find(function (x) { return x.id === id; });
          cb({ exists: !!d, data: function () { return d ? d.data() : undefined; } });
        };
        return collectionOn(col, fn, onErr);
      }
    };
  }

  function collectionOn(col, fn, onErr) {
    listeners[col] = listeners[col] || [];
    listeners[col].push(fn);
    snapCol(col).then(function (docs) { fn({ docs: docs }); }).catch(function (e) { if (onErr) onErr(e); });
    return function () {
      listeners[col] = (listeners[col] || []).filter(function (x) { return x !== fn; });
    };
  }

  var db = {
    collection: function (name) {
      return {
        doc: function (id) { return docRef(name, String(id)); },
        onSnapshot: function (cb, onErr) { return collectionOn(name, cb, onErr); }
      };
    },
    doc: function (path) {
      var r = split(path);
      return docRef(r.col, r.id);
    }
  };
  // Login: o app só carrega depois de entrar com e-mail e senha do Supabase.
  db.signIn = function (email, senha) {
    return sb.auth.signInWithPassword({ email: email, password: senha }).then(function (r) {
      if (r.error) throw r.error; return r.data;
    });
  };
  db.signOut = function () { return sb.auth.signOut(); };
  db.session = function () { return sb.auth.getSession().then(function (r) { return r.data.session; }); };
  db.perfil = function () {
    // Busca só o perfil do usuário logado (evita 'multiple rows' quando o admin enxerga todos)
    return sb.auth.getSession().then(function (ses) {
      var s = ses && ses.data && ses.data.session;
      if (!s) return null;
      return sb.from('profiles').select('nome,funcao,agent_id').eq('id', s.user.id).maybeSingle().then(function (r) {
        if (r.error) throw r.error; return r.data;
      });
    });
  };
  db.storage = sb.storage; // anexos (bucket privado 'anexos')
  window.bahiaDB = db;
})();
