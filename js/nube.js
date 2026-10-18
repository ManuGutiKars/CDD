// Forja de Héroes · capa de nube (Supabase): cuentas con Google, personajes y campañas.
// Si no hay configuración en js/config.js, Nube.activo es false y la app funciona solo en local.
'use strict';
window.Nube = (() => {
  const cfg = window.FORJA_NUBE || {};
  const activo = !!(cfg.url && cfg.clave);
  const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4';
  let sb = null, yo = null, perfil = null;
  const oyentes = [];

  function cargarLib() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise((ok, mal) => {
      const s = document.createElement('script');
      s.src = LIB; s.onload = ok; s.onerror = () => mal(new Error('No se pudo cargar la librería de Supabase'));
      document.head.appendChild(s);
    });
  }
  const err = r => { if (r.error) throw new Error(r.error.message || String(r.error)); return r.data; };

  async function init() {
    if (!activo) return null;
    await cargarLib();
    sb = window.supabase.createClient(cfg.url, cfg.clave, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    const { data } = await sb.auth.getSession();
    await fijarUsuario(data.session && data.session.user);
    sb.auth.onAuthStateChange((_ev, ses) => {
      const u = ses && ses.user;
      if ((u && u.id) === (yo && yo.id)) return;
      fijarUsuario(u).then(() => oyentes.forEach(f => f(yo)));
    });
    return yo;
  }
  async function fijarUsuario(u) {
    if (!u) { yo = null; perfil = null; return; }
    const md = u.user_metadata || {};
    yo = { id: u.id, email: u.email, nombre: md.full_name || md.name || (u.email || '').split('@')[0], avatar: md.avatar_url || md.picture || '' };
    try {
      const r = await sb.from('perfiles').select('*').eq('id', u.id).maybeSingle();
      perfil = r.data;
      if (!perfil) { await sb.from('perfiles').insert({ id: u.id, nombre: yo.nombre, avatar: yo.avatar }); }
      else if (perfil.nombre) yo.nombre = perfil.nombre;
    } catch (e) { /* la tabla aún no existe: se avisará al usarla */ }
  }

  const api = {
    activo,
    usuario: () => yo,
    alCambiar: f => oyentes.push(f),
    init,
    async entrar() {
      const back = location.origin + location.pathname;
      const r = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back } });
      err(r);
    },
    async salir() { await sb.auth.signOut(); yo = null; oyentes.forEach(f => f(null)); },

    // ---- Personajes ----
    async misPersonajes() {
      return err(await sb.from('personajes').select('id,dueno,campana,datos,actualizado').eq('dueno', yo.id).order('actualizado', { ascending: false }));
    },
    async personaje(id) {
      return err(await sb.from('personajes').select('id,dueno,campana,datos,actualizado').eq('id', id).maybeSingle());
    },
    // existe: si la fila ya está en la nube (se actualiza; si no, se crea a mi nombre)
    async guardar(ch, existe) {
      const fila = { datos: ch, campana: ch.campana || null };
      if (existe) {
        const d = err(await sb.from('personajes').update(fila).eq('id', ch.id).select('id'));
        if (d && d.length) return true;
      }
      err(await sb.from('personajes').insert({ id: ch.id, ...fila }));
      return true;
    },
    async borrar(id) { err(await sb.from('personajes').delete().eq('id', id)); },

    // ---- Campañas ----
    async campanas() {
      return err(await sb.from('campanas').select('id,nombre,master,codigo,reglas,creado').order('creado', { ascending: false }));
    },
    async crearCampana(nombre) {
      return err(await sb.from('campanas').insert({ nombre, master: yo.id }).select('id,nombre,master,codigo,reglas,creado').single());
    },
    async editarCampana(id, cambios) { err(await sb.from('campanas').update(cambios).eq('id', id)); },
    async borrarCampana(id) { err(await sb.from('campanas').delete().eq('id', id)); },
    async detalle(id) {
      const c = err(await sb.from('campanas').select('id,nombre,master,codigo,reglas,creado').eq('id', id).maybeSingle());
      if (!c) return null;
      const miembros = err(await sb.from('miembros').select('usuario,unido').eq('campana', id));
      const ids = [c.master, ...miembros.map(m => m.usuario)];
      const perfiles = err(await sb.from('perfiles').select('id,nombre,avatar').in('id', ids));
      const P = Object.fromEntries(perfiles.map(p => [p.id, p]));
      const personajes = err(await sb.from('personajes').select('id,dueno,campana,datos,actualizado').eq('campana', id));
      const notas = err(await sb.from('notas').select('id,titulo,texto,visible_para,actualizado').eq('campana', id).order('actualizado', { ascending: false }));
      return { ...c, perfiles: P, miembros: miembros.map(m => ({ ...m, perfil: P[m.usuario] || { id: m.usuario, nombre: 'Jugador' } })), personajes, notas };
    },
    async verInvitacion(cod) { const d = err(await sb.rpc('ver_invitacion', { cod })); return d && d[0]; },
    async unirse(cod) { return err(await sb.rpc('unirse', { cod })); },
    async nuevoCodigo(id) { return err(await sb.rpc('nuevo_codigo', { c: id })); },
    async quitarMiembro(campana, usuario) { err(await sb.from('miembros').delete().eq('campana', campana).eq('usuario', usuario)); },

    // ---- Imágenes de personaje (almacén público "retratos", carpeta por usuario) ----
    async subirRetrato(blob, chId) {
      const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
      const ruta = `${yo.id}/${String(chId).replace(/[^\w-]/g, '')}-${Date.now()}.${ext}`;
      err(await sb.storage.from('retratos').upload(ruta, blob, { contentType: blob.type, upsert: true, cacheControl: '31536000' }));
      return sb.storage.from('retratos').getPublicUrl(ruta).data.publicUrl;
    },
    async borrarRetrato(url) {
      const m = String(url || '').match(/\/retratos\/(.+)$/);
      if (!m || !m[1].startsWith(yo.id + '/')) return;
      await sb.storage.from('retratos').remove([decodeURIComponent(m[1])]);
    },
    // ---- Notas ----
    async guardarNota(n) {
      const fila = { campana: n.campana, titulo: n.titulo, texto: n.texto, visible_para: n.visible_para, actualizado: new Date().toISOString() };
      if (n.id) { err(await sb.from('notas').update(fila).eq('id', n.id)); return n.id; }
      return err(await sb.from('notas').insert(fila).select('id').single()).id;
    },
    async borrarNota(id) { err(await sb.from('notas').delete().eq('id', id)); }
  };
  return api;
})();
