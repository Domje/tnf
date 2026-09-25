
var app = document.getElementById('app');
var currentCleanup = null;

var ICONS = {
  bookHeart: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M8.62 9.8A2.25 2.25 0 1 1 12 6.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0z"/>',
  listTodo: '<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><rect x="3" y="4" width="6" height="6" rx="1"/>',
  notebookPen: '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
  squarePen: '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>',
  mic: '<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  filePenLine: '<path d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z"/><path d="M14.487 7.858A1 1 0 0 1 14 7V2"/><path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516"/><path d="M8 18h1"/>',
  broomSparkles: '<path d="M11 2v2"/><path d="M12 3h-2"/><path d="M13.5 10.5 22 2"/><path d="M14.734 13.841a2 2 0 00-.314-2.42L12.58 9.58a2 2 0 00-2.421-.314l-7.657 4.461A1 1 0 002.3 15.3l6.403 6.403a1 1 0 001.571-.204z"/><path d="M20 15v4"/><path d="M22 17h-4"/><path d="M4 4v4"/><path d="m5 18 2-2"/><path d="M6 6H2"/><path d="m7.699 10.7 5.602 5.601"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  bold: '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>',
  italic: '<line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/>',
  list: '<path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/>'
};

function icon(name) {
  return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

var ALLOWED_TAGS = { P: 1, BR: 1, B: 1, STRONG: 1, I: 1, EM: 1, UL: 1, LI: 1 };

function sanitizeHtml(html) {
  var tpl = document.createElement('template');
  tpl.innerHTML = html || '';
  (function clean(node) {
    var children = Array.prototype.slice.call(node.childNodes);
    children.forEach(function (child) {
      if (child.nodeType === 1) {
        if (!ALLOWED_TAGS[child.tagName]) {
          while (child.firstChild) child.parentNode.insertBefore(child.firstChild, child);
          child.parentNode.removeChild(child);
          return;
        }
        Array.prototype.slice.call(child.attributes).forEach(function (a) {
          child.removeAttribute(a.name);
        });
        clean(child);
      } else if (child.nodeType !== 3) {
        child.parentNode.removeChild(child);
      }
    });
  })(tpl.content);
  return tpl.innerHTML;
}

function formatSentence(s) {
  s = s.trim();
  if (!s) return '';
  s = s.charAt(0).toUpperCase() + s.slice(1);
  s = s.replace(/\bi\b/g, 'I');
  if (!/[.!?]$/.test(s)) s += '.';
  return s;
}

function formatParagraph(text) {
  text = text.replace(/\s+/g, ' ').trim();
  if (!text) return '';
  var parts = text.split(/(?<=[.!?])\s+/);
  return parts.map(formatSentence).filter(Boolean).join(' ');
}

function formatTranscript(raw, mode) {
  var paragraphs = raw.split(/\n{2,}/).map(function (p) { return formatParagraph(p); }).filter(Boolean);
  if (mode === 'task') {
    return paragraphs.join(' ').replace(/\s+/g, ' ').trim();
  }
  return paragraphs.length ? paragraphs : [''];
}

function getSR() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function createRecognizer(onUpdate, onError) {
  var SR = getSR();
  if (!SR) return null;
  var rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = navigator.language || 'en-US';
  var manualStop = false;
  var finalText = '';
  var lastTime = Date.now();

  rec.onresult = function (e) {
    var now = Date.now();
    var gap = now - lastTime;
    lastTime = now;
    var interim = '';
    for (var i = e.resultIndex; i < e.results.length; i++) {
      var chunk = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        var trimmed = chunk.trim();
        if (!trimmed) continue;
        if (finalText && gap > 3000) finalText += '\n\n';
        else if (finalText) finalText += ' ';
        finalText += trimmed;
      } else {
        interim += chunk;
      }
    }
    onUpdate(finalText, interim);
  };

  rec.onerror = function (e) {
    if (e.error === 'no-speech') return;
    if (onError) onError(e.error);
  };

  rec.onend = function () {
    if (!manualStop) {
      try { rec.start(); } catch (err) {}
    }
  };

  return {
    start: function () { manualStop = false; try { rec.start(); } catch (err) {} },
    stop: function () { manualStop = true; try { rec.stop(); } catch (err) {} }
  };
}

function api(path, opts) {
  return fetch('/api' + path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts))
    .then(function (res) {
      if (!res.ok) throw new Error('Request failed: ' + res.status);
      if (res.status === 204) return null;
      return res.json();
    });
}

function formatDateTime(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function preview(html) {
  var tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  var text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
  return escapeHtml(text.length > 140 ? text.slice(0, 140) + '…' : text);
}

function topbar(title, opts) {
  opts = opts || {};
  var back = opts.back === false
    ? '<span class="back-btn"></span>'
    : '<button class="back-btn" data-action="back">' + icon('chevronLeft') + '</button>';
  var action = opts.actionIcon
    ? '<button class="topbar-action" data-action="' + opts.actionName + '">' + icon(opts.actionIcon) + '</button>'
    : '<span class="topbar-action"></span>';
  return '<div class="topbar" aria-label="' + escapeHtml(title) + '">' + back + '<span class="topbar-spacer"></span>' + action + '</div>';
}

function bindNav(root) {
  root = root || app;
  root.querySelectorAll('[data-nav]').forEach(function (el) {
    el.addEventListener('click', function () { nav(el.getAttribute('data-nav')); });
  });
  var backBtn = root.querySelector('[data-action="back"]');
  if (backBtn) backBtn.addEventListener('click', function () { history.back(); });
}

function renderHome() {
  app.innerHTML =
    '<div class="home-grid">' +
      '<button class="home-tile" data-nav="/journal">' + icon('bookHeart') + '</button>' +
      '<button class="home-tile" data-nav="/tasks">' + icon('listTodo') + '</button>' +
      '<button class="home-tile" data-nav="/journal/new">' + icon('notebookPen') + '</button>' +
      '<button class="home-tile" data-nav="/tasks/new">' + icon('squarePen') + '</button>' +
    '</div>';
  bindNav();
}

function renderJournalList() {
  app.innerHTML = topbar('Journal') + '<main><div class="entry-list" id="list"></div></main>';
  bindNav();
  var listEl = document.getElementById('list');
  api('/entries').then(function (entries) {
    listEl.innerHTML = entries.map(function (e) {
      return '<div class="entry-card">' +
        '<div class="entry-card-body" data-nav="/journal/' + e.id + '">' +
          '<div class="entry-date">' + formatDateTime(e.created_at) + '</div>' +
          '<div class="entry-preview">' + preview(e.content) + '</div>' +
        '</div>' +
        '<button class="icon-btn" data-nav="/journal/' + e.id + '/edit">' + icon('filePenLine') + '</button>' +
      '</div>';
    }).join('');
    bindNav(listEl);
  }).catch(function () {});
}

function renderJournalView(id) {
  app.innerHTML = topbar('Entry', { actionIcon: 'filePenLine', actionName: 'edit' }) +
    '<main><div class="entry-content" id="content"></div></main>';
  bindNav();
  document.querySelector('[data-action="edit"]').addEventListener('click', function () { nav('/journal/' + id + '/edit'); });
  api('/entries/' + id).then(function (entry) {
    document.getElementById('content').innerHTML = sanitizeHtml(entry.content);
  }).catch(function () {});
}

function renderJournalEditor(id, initialHtml) {
  var isNew = !id;
  app.innerHTML = topbar(isNew ? 'New entry' : 'Edit entry') +
    '<main>' +
      '<div class="editor-toolbar">' +
        '<button data-cmd="bold" type="button">' + icon('bold') + '</button>' +
        '<button data-cmd="italic" type="button">' + icon('italic') + '</button>' +
        '<button data-cmd="insertUnorderedList" type="button">' + icon('list') + '</button>' +
      '</div>' +
      '<div class="editor" id="editor" contenteditable="true" data-placeholder="What\'s on your mind?"></div>' +
      '<div class="save-row"><button class="round-btn primary" id="save">' + icon('check') + '</button></div>' +
    '</main>';
  bindNav();
  var editor = document.getElementById('editor');

  if (initialHtml) {
    editor.innerHTML = sanitizeHtml(initialHtml);
  } else if (!isNew) {
    api('/entries/' + id).then(function (entry) {
      editor.innerHTML = sanitizeHtml(entry.content);
    }).catch(function () {});
  }
  editor.focus();

  app.querySelectorAll('[data-cmd]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.execCommand(btn.getAttribute('data-cmd'));
      editor.focus();
    });
  });

  document.getElementById('save').addEventListener('click', function () {
    var html = sanitizeHtml(editor.innerHTML);
    if (isNew) {
      api('/entries', { method: 'POST', body: JSON.stringify({ content: html }) }).then(function (entry) {
        nav('/journal/' + entry.id);
      });
    } else {
      api('/entries/' + id, { method: 'PUT', body: JSON.stringify({ content: html }) }).then(function () {
        nav('/journal/' + id);
      });
    }
  });
}

function renderAddChooser(kind) {
  var supported = !!getSR();
  var base = kind === 'journal' ? '/journal' : '/tasks';
  app.innerHTML = topbar(kind === 'journal' ? 'New entry' : 'New task') +
    '<main>' +
      '<div class="chooser">' +
        (supported ? '<button class="chooser-btn" data-nav="' + base + '/new/voice">' + icon('mic') + '</button>' : '') +
        '<button class="chooser-btn" data-nav="' + base + '/new/text">' + icon('pencil') + '</button>' +
      '</div>' +
    '</main>';
  bindNav();
}

function renderVoiceCapture(kind) {
  app.innerHTML = topbar(kind === 'journal' ? 'New entry' : 'New task') + '<main id="voiceMain"></main>';
  bindNav();
  var main = document.getElementById('voiceMain');
  var phase = 'listening';
  var finalText = '';

  function renderListening(interim) {
    var shown = (finalText + (interim ? ' ' + interim : '')).trim();
    main.innerHTML =
      '<div class="voice-screen">' +
        '<div class="mic-indicator listening">' + icon('mic') + '</div>' +
        '<div class="transcript' + (shown ? ' has-text' : '') + '">' + escapeHtml(shown) + '</div>' +
        '<button class="stop-btn" id="stop">' + icon('x') + '</button>' +
      '</div>';
    document.getElementById('stop').addEventListener('click', stop);
  }

  function renderReview() {
    var formatted = formatTranscript(finalText, kind);
    var displayText = kind === 'journal' ? formatted.join('\n\n') : formatted;
    main.innerHTML =
      '<div class="voice-screen">' +
        '<div class="transcript has-text">' + escapeHtml(displayText) + '</div>' +
        '<div class="review-actions">' +
          '<button class="round-btn" id="discard">' + icon('x') + '</button>' +
          '<button class="round-btn" id="editText">' + icon('squarePen') + '</button>' +
          '<button class="round-btn primary" id="confirm">' + icon('check') + '</button>' +
        '</div>' +
      '</div>';

    document.getElementById('discard').addEventListener('click', function () {
      nav(backTo);
    });

    document.getElementById('editText').addEventListener('click', function () {
      if (kind === 'journal') {
        var html = formatted.map(function (p) { return '<p>' + escapeHtml(p) + '</p>'; }).join('');
        renderJournalEditor(null, html);
      } else {
        renderTaskTextInput(formatted);
      }
    });

    document.getElementById('confirm').addEventListener('click', function (e) {
      e.currentTarget.disabled = true;
      if (kind === 'journal') {
        var html = formatted.map(function (p) { return '<p>' + escapeHtml(p) + '</p>'; }).join('');
        api('/entries', { method: 'POST', body: JSON.stringify({ content: sanitizeHtml(html) }) }).then(function (entry) {
          nav('/journal/' + entry.id);
        });
      } else {
        api('/tasks', { method: 'POST', body: JSON.stringify({ text: formatted }) }).then(function () {
          nav('/tasks');
        });
      }
    });
  }

  function stop() {
    if (phase !== 'listening') return;
    phase = 'reviewing';
    recognizer.stop();
    renderReview();
  }

  var backTo = kind === 'journal' ? '/journal/new' : '/tasks/new';

  var recognizer = createRecognizer(
    function (f, interim) { finalText = f; if (phase === 'listening') renderListening(interim); },
    function () {
      if (phase !== 'listening') return;
      phase = 'error';
      nav(backTo);
    }
  );

  if (!recognizer) {
    nav(backTo);
    return;
  }

  currentCleanup = function () { try { recognizer.stop(); } catch (e) {} };
  renderListening('');
  recognizer.start();
}

function renderTasksList() {
  app.innerHTML = topbar('Tasks', { actionIcon: 'broomSparkles', actionName: 'clear' }) +
    '<main>' +
      '<div class="task-input-row"><input id="newTask" placeholder="Add a task"></div>' +
      '<div class="task-list" id="taskList"></div>' +
    '</main>';
  bindNav();
  var listEl = document.getElementById('taskList');
  var newInput = document.getElementById('newTask');
  var tasks = [];

  function taskRowHtml(t) {
    return '<div class="task-row ' + (t.done ? 'done' : '') + '" data-id="' + t.id + '">' +
      '<button class="task-check" type="button">' + (t.done ? icon('check') : '') + '</button>' +
      '<input class="task-text" value="' + escapeHtml(t.text).replace(/"/g, '&quot;') + '">' +
    '</div>';
  }

  function renderEmptyIfNeeded() {
    if (!tasks.length) listEl.innerHTML = '';
  }

  function wireTaskRow(row) {
    var check = row.querySelector('.task-check');
    var textInput = row.querySelector('.task-text');
    var saveTimer;

    check.addEventListener('click', function () {
      var id = row.getAttribute('data-id');
      var task = tasks.find(function (t) { return String(t.id) === id; });
      if (!task) return;
      task.done = task.done ? 0 : 1;
      row.classList.toggle('done', !!task.done);
      check.innerHTML = task.done ? icon('check') : '';
      api('/tasks/' + id, { method: 'PATCH', body: JSON.stringify({ done: !!task.done }) }).catch(function () {});
    });

    textInput.addEventListener('input', function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        var id = row.getAttribute('data-id');
        var task = tasks.find(function (t) { return String(t.id) === id; });
        if (task) task.text = textInput.value;
        api('/tasks/' + id, { method: 'PATCH', body: JSON.stringify({ text: textInput.value }) }).catch(function () {});
      }, 500);
    });

    textInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        textInput.blur();
      } else if (e.key === 'Backspace' && textInput.value === '' && textInput.selectionStart === 0) {
        e.preventDefault();
        clearTimeout(saveTimer);
        var id = row.getAttribute('data-id');
        tasks = tasks.filter(function (t) { return String(t.id) !== id; });
        row.remove();
        renderEmptyIfNeeded();
        api('/tasks/' + id, { method: 'DELETE' }).catch(function () {});
      }
    });
  }

  api('/tasks').then(function (result) {
    tasks = result;
    if (!tasks.length) {
      renderEmptyIfNeeded();
      return;
    }
    listEl.innerHTML = tasks.map(taskRowHtml).join('');
    listEl.querySelectorAll('.task-row').forEach(wireTaskRow);
  }).catch(function () {});

  newInput.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    var text = newInput.value.replace(/[\r\n]+/g, ' ').trim();
    if (!text) return;
    newInput.value = '';
    var optimisticTask = { id: 'tmp-' + Date.now(), text: text, done: 0 };
    tasks.push(optimisticTask);
    var wrap = document.createElement('div');
    wrap.innerHTML = taskRowHtml(optimisticTask);
    var rowEl = wrap.firstElementChild;
    listEl.appendChild(rowEl);
    wireTaskRow(rowEl);
    api('/tasks', { method: 'POST', body: JSON.stringify({ text: text }) }).then(function (saved) {
      optimisticTask.id = saved.id;
      rowEl.setAttribute('data-id', saved.id);
    }).catch(function () {});
  });

  document.querySelector('[data-action="clear"]').addEventListener('click', function () {
    tasks = tasks.filter(function (t) { return !t.done; });
    if (!tasks.length) {
      renderEmptyIfNeeded();
    } else {
      listEl.innerHTML = tasks.map(taskRowHtml).join('');
      listEl.querySelectorAll('.task-row').forEach(wireTaskRow);
    }
    api('/tasks/clear-completed', { method: 'POST' }).catch(function () {});
  });
}

function renderTaskTextInput(initialText) {
  app.innerHTML = topbar('New task') +
    '<main>' +
      '<input class="text-input" id="taskText" placeholder="What needs doing?" value="' + escapeHtml(initialText || '').replace(/"/g, '&quot;') + '">' +
      '<div class="save-row"><button class="round-btn primary" id="save">' + icon('check') + '</button></div>' +
    '</main>';
  bindNav();
  var input = document.getElementById('taskText');
  input.focus();

  function save() {
    var text = input.value.replace(/[\r\n]+/g, ' ').trim();
    if (!text) return;
    api('/tasks', { method: 'POST', body: JSON.stringify({ text: text }) }).then(function () {
      nav('/tasks');
    });
  }

  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); save(); } });
  document.getElementById('save').addEventListener('click', save);
}

function nav(path) { location.hash = '#' + path; }

function parseRoute() {
  var h = location.hash.replace(/^#/, '') || '/';
  var parts = h.split('/').filter(Boolean);
  if (!parts.length) return { name: 'home' };

  if (parts[0] === 'journal') {
    if (parts.length === 1) return { name: 'journal-list' };
    if (parts[1] === 'new') {
      if (parts.length === 2) return { name: 'journal-add-chooser' };
      if (parts[2] === 'voice') return { name: 'journal-voice' };
      if (parts[2] === 'text') return { name: 'journal-text' };
    }
    if (parts.length === 2) return { name: 'journal-view', id: parts[1] };
    if (parts.length === 3 && parts[2] === 'edit') return { name: 'journal-edit', id: parts[1] };
  }

  if (parts[0] === 'tasks') {
    if (parts.length === 1) return { name: 'tasks-list' };
    if (parts[1] === 'new') {
      if (parts.length === 2) return { name: 'tasks-add-chooser' };
      if (parts[2] === 'voice') return { name: 'tasks-voice' };
      if (parts[2] === 'text') return { name: 'tasks-text' };
    }
  }

  return { name: 'home' };
}

function render() {
  if (currentCleanup) {
    try { currentCleanup(); } catch (e) {}
    currentCleanup = null;
  }
  var r = parseRoute();
  switch (r.name) {
    case 'journal-list': renderJournalList(); break;
    case 'journal-add-chooser': renderAddChooser('journal'); break;
    case 'journal-voice': renderVoiceCapture('journal'); break;
    case 'journal-text': renderJournalEditor(null); break;
    case 'journal-view': renderJournalView(r.id); break;
    case 'journal-edit': renderJournalEditor(r.id); break;
    case 'tasks-list': renderTasksList(); break;
    case 'tasks-add-chooser': renderAddChooser('task'); break;
    case 'tasks-voice': renderVoiceCapture('task'); break;
    case 'tasks-text': renderTaskTextInput(); break;
    default: renderHome();
  }
}

window.addEventListener('hashchange', render);
render();
