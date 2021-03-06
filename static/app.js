var pos = null;
var pnt = null;
var chg = false;

function $(el) {
    return document.getElementById(el);
}

function span(el) {
    return el.getElementsByTagName('span')[0];
}

function task_done() {
    var check = pos.childNodes[0];
    check.click();
    chg = true;   
}

function fill_li(state=0, desc='') {
    var check = pos.appendChild(document.createElement('input'));
    check.setAttribute('type', 'checkbox');
    check.onclick = function () {
        var desc = this.nextSibling;
        if (this.checked)
            desc.style.textDecorationLine = 'line-through';
        else
            desc.style.textDecorationLine = 'none';
        chg = true;   
    }
    var input = pos.appendChild(document.createElement('span'));
    input.setAttribute('contentEditable', true);
    input.innerHTML = desc;
    input.focus();
    input.onfocus = function() {
        pos = this.parentNode;
    }
    input.oninput = function() {
        chg = true
    }
    if (state == 1) {
        check.checked = true;
        input.style.textDecorationLine = 'line-through';
    }
}

function task_insert(state=0, desc='') {
    var li = document.createElement('li');
    if (pos != null)
        pos = pos.parentNode.insertBefore(li, pos.nextSibling);
    else {
        var ul = $('todo_list');
        pos = ul.appendChild(li);
    }
    fill_li(state, desc);
    chg = true;   
}

function task_children(state=0, desc='') {
    if (pos != null) {
        var ul = document.createElement('ul');
        pos.appendChild(ul);
        var li = document.createElement('li');
        pos = ul.appendChild(li);
        fill_li(state, desc);
        chg = true;   
    }
}

function todo_append(pnt) {
    if (!pnt)
        return [];
    var children = pnt.childNodes;
    if (!children)
        return [];
    var tasks = [];
    for (var i = 0; i < children.length; i++) {
        var task = {};
        var li = children[i];
        var inputs = li.getElementsByTagName('input');
        if (inputs[0].checked)
            task.state = 1;
        else
            task.state = 0;
        task.desc = li.getElementsByTagName('span')[0].innerHTML;
        var ul = li.getElementsByTagName('ul');
        task.collapsed = false;
        if (ul && ul[0]) {
            task.children = todo_append(ul[0]);
            if (ul[0].style.display == 'none')
                task.collapsed = true;
        }
        else
            task.children = [];
        tasks.push(task); 
    }
    return tasks;
}

function task_save() {
    if (!chg) return;
    var pnt = $('todo_list');
    if (pnt != null) {
        var todo = todo_append(pnt); 
        localStorage.setItem('todo', JSON.stringify(todo));
    }
    var key = $('key').value
    if (key) {
        var xhr = new XMLHttpRequest();
        xhr.open("post", $('server').value + "/keys/" + key, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        xhr.send(JSON.stringify(todo))
    }
    chg = false;
}

function key_get()  {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            if (xhr.status == 200) {
                $('key').value = xhr.responseText;
                localStorage.setItem('key', xhr.responseText);
            }
        }
    }
    xhr.open('get', $('server').value + "/keys/new", true); 
    xhr.send();
}

function key_set() {
    var key = $('key').value;
    if (key) {
        localStorage.setItem('key', key);
        task_load();
    }
}

function task_copy() {
    var pnt = $('todo_list');
    if (pnt != null) {
        var todo = todo_append(pnt); 
        todo_str = JSON.stringify(todo);
        return todo_str;
    }
}

function todo_load(pnt, todo) {
    if (!todo) return;
    for (var i = 0; i < todo.length; i++) {
        pos = document.createElement('li');
        pnt.appendChild(pos);
        fill_li(todo[i].state, todo[i].desc);
        span(pos).focus();
        if (todo[i].children.length > 0) {
            var ul = document.createElement('ul');
            pos.appendChild(ul);
            todo_load(ul, todo[i].children);
            if (todo[i].collapsed)
                ul.style.display = 'none';
        }
    }
}

function task_load() {
    var key = localStorage.getItem('key')
    $('key').value = key
    if (key) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status == 200) {
                    pos = null;
                    pnt = $('todo_list');
                    pnt.innerHTML = '';
                    todo = JSON.parse(xhr.responseText);
                    todo_load(pnt, todo);
                }
            }
        }
        xhr.open('get', $('server').value + "/keys/" + key, true); 
        xhr.send();
    }
    else {
        pos = null;
        pnt = $('todo_list');
        pnt.innerHTML = '';
        todo = JSON.parse(localStorage.getItem('todo'));
        todo_load(pnt, todo); 
    }
}

function task_delete() {
    if (!pos)
        return;
    if (span(pos).innerText.length > 1) {
        if (!confirm('Are you sure to delete this item?'))
            return;
    }
    var prv = pos.previousSibling;
    pnt = pos.parentNode;
    pnt.removeChild(pos);
    if (!prv && pnt) {
        pos = pnt.parentNode;
        pos.removeChild(pnt);
    }
    else
        pos = prv;
    if (pos)
        pos.getElementsByTagName('span')[0].focus();
    if (pnt != $('todo_list'))
        pnt = pos.parentNode;
    span(pos).focus();
    chg = true;   
}

function task_move_up() {
    var prv = pos.previousSibling;
    pnt = pos.parentNode;
    if (prv) {
        pnt.insertBefore(pos, prv);
    }
    span(pos).focus();
    chg = true;   
}

function task_move_down() {
    var nxt = pos.nextSibling;
    pnt = pos.parentNode;
    if (nxt)
        pnt.insertBefore(nxt, pos);
    span(pos).focus();
    chg = true;   
}

function task_collapse() {
    if (pos == null) return;
    var uls = pos.getElementsByTagName('ul');
    if (uls && uls[0]) {
        if (uls[0].style.display != 'none')
            uls[0].style.display = 'none';
        else
            uls[0].style.display = 'block';
    }
    chg = true;   
}

function key_press(ev) {
    console.log(ev.keyCode);
    if (ev.ctrlKey && ev.keyCode == 40)
        task_move_down();
    if (ev.ctrlKey && ev.keyCode == 38)
        task_move_up();
    if (ev.ctrlKey && ev.keyCode == 0)
        task_collapse();
    if (ev.keyCode == 13)
        task_insert();
    if (ev.keyCode == 8 && span(pos).innerText <= 1)
        task_delete();
    if (ev.ctrlKey && ev.keyCode == 46)
        task_delete();
    if (ev.ctrlKey && ev.keyCode == 45)
        task_children();
    if (!ev.ctrlKey && ev.keyCode == 40) {
        var prv = pos.nextSibling;
        if (prv) {
            pos = prv;
            span(pos).focus();
        }
    }
    if (!ev.ctrlKey && ev.keyCode == 38) {
        var prv = pos.previousSibling;
        if (prv) {
            pos = prv;
            span(pos).focus();
        }
    }
    if (ev.ctrlKey && ev.keyCode == 39) {
        var uls = pos.getElementsByTagName('ul');
        if (uls && uls[0]) {
            var lis = uls[0].getElementsByTagName('li');
            if (lis && lis[0]) {
                var prv = lis[0];
                pos = prv;
                span(pos).focus();
            }
        }
    }
    if (ev.ctrlKey && ev.keyCode == 37) {
        var ul = pos.parentNode;
        if (ul == $('todo_list')) return;
        var prv = ul.parentNode;
        pos = prv;
        span(pos).focus();
    }
    if (ev.ctrlKey && ev.keyCode == 113)
        task_copy();
}

function task_setup() {
    if ($('setup').style.display == 'none') {
        $('main').style.display = 'none';
        $('setup').style.display = 'block';
        $('json').innerHTML = task_copy();
        $('btn_json').onclick = function () {
            if (!confirm('Are you sure to replace list?'))
                return;
            var todo_str = $('json').value;
            pos = null;
            pnt = $('todo_list');
            pnt.innerHTML = '';
            todo_load(pnt, JSON.parse(todo_str)); 
        }
    }
    else {
        $('main').style.display = 'block';
        $('setup').style.display = 'none';
    }
}

window.onload = function() {
    $('btn_new').onclick = task_insert; 
    $('btn_chd').onclick = task_children; 
    $('btn_done').onclick = task_done; 
    $('btn_del').onclick = task_delete; 
    $('btn_up').onclick = task_move_up; 
    $('btn_down').onclick = task_move_down; 
    $('btn_coll').onclick = task_collapse;
    $('btn_setup').onclick = task_setup;
    $('setup').style.display = 'none';
    $('server').value = 'http://' + window.location.host;
    $('key').value = localStorage.getItem('key', key)
    $('btn_key_get').onclick = key_get;
    $('btn_key_set').onclick = key_set;
    window.onkeypress = key_press;
    task_load();
    setInterval(task_save, 10000);
    /*
    window.onpageshow = function () {
        task_load();
    }
    window.onpagehide = function () {
        task_save();
    }
    */
}
