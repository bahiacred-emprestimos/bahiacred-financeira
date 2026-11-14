// Ponte entre o sistema e o Supabase: exige login e entrega ao app o mesmo "claude.use" de antes.
// Sem sessão válida, volta para a tela de entrada (index.html).
(function () {
  var READY = (async function () {
    try {
      var s = await window.bahiaDB.session();
      if (!s) { location.replace('index.html'); return null; }
      var p;
      try { p = await window.bahiaDB.perfil(); }
      catch (e) {
        // Não volta para o login (evita laço): mostra o erro na tela
        console.error(e);
        document.body.innerHTML = '<div style="font-family:sans-serif;padding:24px">Não consegui ler o seu perfil no banco. Erro: ' + String((e && e.message) || e).replace(/</g, '') + '</div>';
        return null;
      }
      if (!p || !p.funcao) {
        document.body.innerHTML = '<div style="font-family:sans-serif;padding:24px">Seu usuário ainda não tem função definida. Fale com o administrador.</div>';
        return null;
      }
      window.BAHIA_ME = { uid: s.user.id, funcao: p.funcao, agent: p.agent_id || null };
      return window.BAHIA_ME;
    } catch (e) {
      console.error(e);
      document.body.innerHTML = '<div style="font-family:sans-serif;padding:24px">Erro ao conectar com o banco: ' + String((e && e.message) || e).replace(/</g, '') + '</div>';
      return null;
    }
  })();

  function saveBlob(filename, data) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    return Promise.resolve(true);
  }

  window.claude = {
    use: async function (name) {
      var me = await READY;
      if (!me) return null;
      if (name === 'db') return window.bahiaDB;
      if (name === 'user') return {
        id: async function () { return me.uid; },
        isOwner: function () { return me.funcao === 'admin'; },
        canEdit: function () { return me.funcao === 'admin'; }
      };
      if (name === 'downloads') return { save: function (o) { return saveBlob(o.filename, o.data); } };
      if (name === 'assets') {
        var BUCKET = 'anexos';
        return {
          upload: async function (blob) {
            var path = me.uid + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.bin';
            var st = window.bahiaDB.storage.from(BUCKET);
            var up = await st.upload(path, blob, { contentType: blob.type || 'application/octet-stream', upsert: false });
            if (up.error) throw up.error;
            var sg = await st.createSignedUrl(path, 60 * 60 * 24 * 365);
            if (sg.error) throw sg.error;
            return { id: path, url: sg.data.signedUrl, sizeBytes: blob.size, contentType: blob.type || '' };
          },
          delete: async function (id) {
            var r = await window.bahiaDB.storage.from(BUCKET).remove([String(id)]);
            if (r.error) throw r.error;
          }
        };
      }
      // Leitura automática de RG fica desligada (usa IA paga). Cadastro é manual.
      return null;
    }
  };
})();
