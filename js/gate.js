// Ponte entre o sistema e o Supabase: exige login e entrega ao app o mesmo "claude.use" de antes.
// Sem sessão válida, volta para a tela de entrada (index.html).
(function () {
  var READY = (async function () {
    try {
      var s = await window.bahiaDB.session();
      if (!s) { location.replace('index.html'); return null; }
      var p = await window.bahiaDB.perfil();
      if (!p || !p.funcao) {
        document.body.innerHTML = '<div style="font-family:sans-serif;padding:24px">Seu usuário ainda não tem função definida. Fale com o administrador.</div>';
        return null;
      }
      window.BAHIA_ME = { uid: s.user.id, funcao: p.funcao, agent: p.agent_id || null };
      return window.BAHIA_ME;
    } catch (e) {
      console.error(e);
      location.replace('index.html');
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
      // Anexos e leitura automática de RG ainda não foram ligados ao novo banco.
      return null;
    }
  };
})();
