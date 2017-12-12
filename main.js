var model = {};
var view = {};
var handlers = {};
var dateUtils = {
  today: function () {
    return moment();
  },
  todayInMS: function () {
    return moment().valueOf();
  },
  dayInMS: function () {
    return moment.duration(1, 'days').asMilliseconds();
  },
  isValidDate: function (dateVal) {
    return moment(dateVal, 'DD-MM-YYYY').isValid();
  },
  isAfterNow: function (dateVal) {
    return dateVal.valueOf() - this.todayInMS() > this.dayInMS();
  },
  isNow: function (dateVal) {
    return dateVal.valueOf() - this.todayInMS() < this.dayInMS() && dateVal.valueOf() - this.todayInMS() > 0;
  },
  isBeforeNow: function (dateVal) {
    return dateVal.valueOf() - this.todayInMS() <= 0;
  },
  fmtDueDate: function (dateVal) {
    return moment(dateVal, 'DD-MM-YYYY HH:mm a');
  },
  itemTimeInMS: function (timeVal) {
    return timeVal.valueOf();
  }
};

var itemStorage = (function () {
  var setItem = function (key, item) {
    localStorage.setItem(key, JSON.stringify({
      itemText: item.itemText,
      DateTime: item.DateTime._i,
      completed: item.completed,
      itemID: item.itemID
    }));
  };

  var getItem = function (key) {
    var keyData = JSON.parse(localStorage.getItem(key));
    return model.createItem(keyData.itemText, keyData.DateTime, keyData.itemID, keyData.completed);
  };

  var removeItem = function (key) {
    localStorage.removeItem(key);
  };

  var syncStorage = function () {
    var item;
    if (localStorage.length > 0) {
      Object.keys(localStorage).forEach(function (key) {
        item = itemStorage.getItem(key);
        model.items.push(item);
        handlers.scheduleTimer(item);
      });

      model.nextID = _.max(model.items.map(function (i) {
        return i.itemID;
      })) + 1;

      model.items = _.sortBy(model.items, function (i) { return i.itemID; });
    } else {
      model.nextID = 1;
    }
  };

  return {
    setItem: setItem,
    getItem: getItem,
    removeItem: removeItem,
    syncStorage: syncStorage
  };
}());

model.items = [];
handlers.timers = {};

model.addItem = function (text, date) {
  var item = model.createItem(text, date, this.nextID, false);
  this.items.push(item);
  itemStorage.setItem(item.itemID, item);
  model.nextID += 1;

  return item;
};

model.createItem = function (text, timeText, id, completed) {
  return {
    itemText: text,
    DateTime: dateUtils.fmtDueDate(timeText),
    completed: completed,
    itemID: id,
    isActive: function () { return dateUtils.isAfterNow(this.DateTime) && !this.completed; },
    isUrgent: function () { return dateUtils.isNow(this.DateTime) && !this.completed; },
    isExpired: function () { return dateUtils.isBeforeNow(this.DateTime) && !this.completed; }
  };
};

model.count = function (itemType) {
  var filters = {
    expired: function (i) { return i.isExpired(); },
    active: function (i) { return i.isActive(); },
    urgent: function (i) { return i.isUrgent(); },
    completed: function (i) { return i.completed; }
  };

  if (itemType in filters) {
    return this.items.filter(filters[itemType]).length;
  }
  throw new Error(itemType + ' is not a filter');
};

model.changeItem = function (pos, text, date) {
  var item = this.items[pos];
  item.itemText = text;
  item.DateTime = dateUtils.fmtDueDate(date);
  itemStorage.setItem(item.itemID, item);
};

model.deleteItem = function (pos) {
  var item = this.items[pos];
  this.items.splice(pos, 1);
  itemStorage.removeItem(item.itemID);
};

model.toggleComplete = function (pos) {
  var item = this.items[pos];
  item.completed = !item.completed;
  itemStorage.setItem(item.itemID, item);
};

model.toggleAll = function () {
  var totalItems = this.items.length;
  var completedItemsNum = this.items.filter(function (item) {
    return item.completed;
  }).length;

  if (totalItems === completedItemsNum) {
    this.items.forEach(function (item) {
      item.completed = false;
    });
  } else {
    this.items.forEach(function (item) {
      item.completed = true;
    });
  }

  this.items.forEach(function (item) {
    itemStorage.setItem(item.itemID, item);
  });
};

view.todoScreen = 'All';

view.displayItems = function () {
  var counter = model.count('active');
  var counterComplete = model.count('completed');
  var counterUrgent = model.count('urgent');
  var counterExpired = model.count('expired');

  $('#All').text(model.items.length > 0 ? model.items.length + ' All' : 'All');
  $('#Active').text(counter > 0 ? counter + ' Active' : 'Active');
  $('#Completed').text(counterComplete > 0 ? counterComplete + ' Completed' : 'Completed');
  $('#Expired').text(counterExpired > 0 ? counterExpired + ' Expired' : 'Expired');
  $('#Urgent').text(counterUrgent > 0 ? counterUrgent + ' Urgent' : 'Urgent');

  $('.list ul').html('');

  model.items.forEach(function (item, pos) {
    var showAll = this.todoScreen === 'All';
    var showActive = this.todoScreen === 'Active' && item.isActive();
    var showCompleted = this.todoScreen === 'Completed' && item.completed;
    var showUrgent = this.todoScreen === 'Urgent' && item.isUrgent();
    var showExpired = this.todoScreen === 'Expired' && item.isExpired();

    if (showAll || showActive || showCompleted || showUrgent || showExpired) {
      this.createItem(item, pos);
    }
  }, this);
};

view.createDeleteBtn = function () {
  return $('<i id="delete" class="fa fa-window-close column"></i>');
};

view.createEditBtn = function () {
  return $('<i id="edit" class="fa fa-pencil-square-o column is-1"></i>');
};

view.createDateTxt = function (item) {
  var $dateTxt = $('<small class="column is-3"></small>');
  var dueDate = dateUtils.fmtDueDate(item.DateTime).from(dateUtils.todayInMS());
  if (item.completed || this.todoScreen === 'Expired') {
    $dateTxt.addClass('strike');
  }
  $dateTxt.text(dueDate);
  return $dateTxt;
};

view.createItemIcon = function (item) {
  var $itemIcon = $('<i id="incomplete" class="fa fa-circle-o column is-1"></i>');
  if (item.completed) {
    $itemIcon.toggleClass('fa-circle-o fa-check-circle-o');
    $itemIcon.attr('id', 'complete');
  } else if (this.todoScreen === 'Urgent') {
    $itemIcon.addClass('fa-exclamation-triangle').removeClass('fa-circle-o');
  } else if (this.todoScreen === 'Expired') {
    $itemIcon.addClass('fa-exclamation');
  }
  return $itemIcon;
};

view.createItemTxt = function (item) {
  var $itemTxt = $('<span class="column is-7"></span>');
  if (item.completed || view.todoScreen === 'Expired') {
    $itemTxt.addClass('strike');
  }
  $itemTxt.text(item.itemText);
  return $itemTxt;
};

view.createItem = function (item, pos) {
  var $li = $('<li class="column columns is-12"></li>');
  $li.attr('id', pos);
  $li.append(this.createItemIcon(item));
  $li.append(this.createItemTxt(item));
  $li.append(this.createDateTxt(item));
  $li.append(this.createEditBtn());
  $li.append(this.createDeleteBtn());
  $('.list ul').append($li);
};

view.createInputField = function (pos) {
  var $inputField = $('<input type="text" class="edit-txt input column is-6 is-offset-1">');
  if (
    model.items[pos].itemText === '' ||
    model.items[pos].itemText === undefined
  ) {
    $inputField.val('');
  } else {
    $inputField.val(model.items[pos].itemText);
  }
  return $inputField;
};

view.createDateField = function (pos) {
  var $dateField = $('<input type="date" class="edit-date input column is-3 is-offset-1">');
  if (model.items[pos].DateTime === '') {
    $dateField.attr('placeholder', 'DD/MM/YYYY');
  } else {
    $dateField.val(model.items[pos].DateTime);
  }
  return $dateField;
};

view.createTimeField = function (pos) {
  var $timeField = $('<input type="text" class="edit-time input column is-1">');
  if (model.items[pos].DateTime === '') {
    $timeField.attr('placeholder', 'Time');
  } else {
    $timeField.val(model.items[pos].DateTime);
  }
  return $timeField;
};

view.createSaveBtn = function (pos) {
  return $('<i id="save" class="fa fa-floppy-o column"></i>');
};

view.createNotification = function (type) {
  var $notif = $('<div class="notification xcentered column is-3"></div>');
  if (type === 'text') {
    $notif.addClass('is-danger');
    $notif.html('Please enter a <strong>valid</strong> 2-Do');
  } else if (type === 'date') {
    $notif.addClass('is-warning');
    $notif.html('Please enter a <strong>valid</strong> date');
  } else if (type === 'time') {
    $notif.addClass('is-warning');
    $notif.html('Please enter a <strong>valid</strong> time');
  } else if (type === 'expired') {
    $notif.addClass('is-warning');
    $notif.html('An item has expired');
  }
  $('h1').after($notif.hide().fadeIn(250));
  setTimeout(function () {
    $notif.fadeOut();
  }, 2500);
};

view.enterListener = function () {
  var $dateInput = $('#date-txt').pickadate();
  var enterPress = function (e) {
    var itemTxt = $('#item-txt').val();
    var datePicker = $dateInput.pickadate('picker');
    var invalidItemDate = !dateUtils.isValidDate(datePicker.get('select', 'dd-mm-yyyy'));
    if (e.which === 13 || e.keyCode === 13) {
      if (itemTxt === '') {
        $('#item-txt').addClass('is-danger');
        view.createNotification('text');
      } else if (invalidItemDate) {
        $('#date-txt').addClass('is-warning');
        view.createNotification('date');
      } else if ($('#time-txt').val() === '') {
        $('#time-txt').addClass('is-warning');
        view.createNotification('time');
      } else {
        handlers.addItem();
      }
    }

    setTimeout(function () {
      $('#item-txt').removeClass('is-danger');
      $('#date-txt').removeClass('is-warning');
      $('#time-txt').removeClass('is-warning');
    }, 2500);
  };
  $('#time-txt').pickatime();
  $('input').on('keypress', enterPress);
};

view.colorState = function () {
  $('#nav').children().each(function () {
    $(this).css({ 'background-color': '#fff' });
  });
};

view.toggleStates = function () {
  var stateToggle = function (e) {
    var elementClicked = e.target;
    this.colorState();
    this.todoScreen = elementClicked.id;
    elementClicked.style.backgroundColor = '#aaa3';
    this.displayItems();
  }.bind(this);
  $('#nav').on('click', stateToggle);
};

view.setUpEvents = function () {
  $('.list ul').on('click', function (event) {
    var clickedElm = event.target;
    if (clickedElm.id === 'delete') {
      handlers.deleteItem(clickedElm.parentNode.id);
    } else if (clickedElm.id === 'complete' || clickedElm.id === 'incomplete') {
      handlers.toggleComplete(clickedElm.parentNode.id);
    } else if (clickedElm.id === 'edit') {
      handlers.changeItem(clickedElm.parentNode.id);
    } else if (clickedElm.id === 'save') {
      handlers.saveItem(clickedElm.parentNode.id);
    }
  });
  $('#toggle').click(function () {
    handlers.toggleAll();
  });
};

handlers.addItem = function () {
  var $textField = $('#item-txt');
  var $inputField = $('#date-txt');
  var $timeField = $('#time-txt');
  var $inputDate = $inputField.pickadate('picker');
  var $inputTime = $timeField.pickatime('picker');
  var itemDate = $inputDate.get('select', 'dd-mm-yyyy');
  var timeInput = $inputTime.get('select', 'HH:i A');
  var itemTime = itemDate + ' ' + timeInput;
  var formattedItemTime = dateUtils.fmtDueDate(itemTime);
  var item = model.addItem($textField.val(), itemTime);
  $textField.val('');
  $inputField.val('');
  $timeField.val('');

  if (!dateUtils.isBeforeNow(formattedItemTime)) {
    handlers.timers[item.itemID] = handlers.scheduleTimer(item);
  }

  view.displayItems();
};

handlers.changeItem = function (pos) {
  var $itemID = $('#' + pos);
  $itemID.html('');
  $itemID.append(view.createInputField(pos));
  $itemID.append(view.createDateField(pos));
  $itemID.append(view.createTimeField(pos));
  $itemID.append(view.createSaveBtn(pos));
  $itemID.append(view.createDeleteBtn());
  $('.edit-date').pickadate();
  $('.edit-time').pickatime();
};

handlers.saveItem = function (pos) {
  var editInputTxt = $('#' + pos).find('.edit-txt').val();
  var editInputField = $('#' + pos).find('.edit-date');
  var editTimeField = $('#' + pos).find('.edit-time');
  var timePicker = $(editTimeField).pickatime('picker');
  var picker = $(editInputField).pickadate('picker');
  var editInputDate = picker.get('select', 'dd-mm-yyyy');
  var editInputTime = timePicker.get('select', 'HH:i A');
  var editedTime = editInputDate + ' ' + editInputTime;
  var formattedEditedTime = dateUtils.fmtDueDate(editedTime);
  var item = model.items[pos];
  var timers = handlers.timers;

  if (editInputTxt === '') {
    view.createNotification('text');
  } else if (!dateUtils.isValidDate(editInputDate)) {
    view.createNotification('date');
  } else if (editInputTime === '') {
    view.createNotification('time');
  } else {
    model.changeItem(pos, editInputTxt, editedTime);

    if (item.itemID in timers) {
      clearTimeout(timers[item.itemID]);
      delete timers[item.itemID];
    }

    if (!dateUtils.isBeforeNow(formattedEditedTime)) {
      timers[item.itemID] = handlers.scheduleTimer(item);
    }
    view.displayItems();
  }
};

handlers.deleteItem = function (pos) {
  var item = model.items[pos];
  var timers = handlers.timers;

  model.deleteItem(pos);

  if (item.itemID in timers) {
    clearTimeout(timers[item.itemID]);
    delete timers[item.itemID];
  }

  view.displayItems();
};

handlers.toggleComplete = function (pos) {
  model.toggleComplete(pos);
  view.displayItems();
};

handlers.toggleAll = function () {
  $('#toggle').toggleClass('fa fa-toggle-off fa fa-toggle-on');
  model.toggleAll();
  view.displayItems();
};

handlers.sortItems = function () {
  $('#list').sortable()
    .disableSelection()
    .on('sortupdate', function () {
      model.items = $.makeArray($('#list li'))
        .map(function (li) {
          return model.items[li.id];
        });
    });
};

handlers.scheduleTimer = function (item) {
  handlers.timers[item.itemID] = setTimeout(function () {
    view.createNotification('expired');
    view.displayItems();
  }, item.DateTime - dateUtils.todayInMS());
};

$(document).ready(function () {
  view.setUpEvents();
  view.enterListener();
  view.toggleStates();
  handlers.sortItems();
  itemStorage.syncStorage();
  view.displayItems();
}
);
