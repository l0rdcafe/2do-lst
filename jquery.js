var model = {};
var view = {};
var handlers = {};
var dateUtils = {
  today: function () {
    return moment();
  },
  isValidDate: function (dateVal) {
    return moment(dateVal, 'DD-MM-YYYY').isValid();
  },
  isAfterToday: function (dateVal) {
    return !this.isBeforeToday(dateVal);
  },
  isToday: function (dateVal) {
    return moment(dateVal, 'DD-MM-YYYY').isSame(this.today(), 'day');
  },
  isBeforeToday: function (dateVal) {
    return moment(dateVal, 'DD-MM-YYYY').isBefore(this.today(), 'day');
  },
  fmtDueDate: function (dateVal) {
    return moment(dateVal, 'DD-MM-YYYY')
          .startOf('day')
          .from(this.today().startOf('day'));
  }
};

model.items = [];

model.addItem = function (text, date) {
  var item = {
    itemText: text,
    itemDate: date,
    completed: false,
    isActive: function () { return dateUtils.isAfterToday(this.itemDate) && !this.completed; },
    isUrgent: function () { return dateUtils.isToday(this.itemDate) && !this.completed; },
    isExpired: function () { return dateUtils.isBeforeToday(this.itemDate) && !this.completed; }
  };
  this.items.push(item);
};

model.count = function (itemType) {
  var filters = {
    expired: function (i) { return !i.completed && i.isExpired(); },
    active: function (i) { return !i.completed && i.isActive(); },
    urgent: function (i) { return !i.completed && i.isUrgent(); },
    completed: function (i) { return i.completed; }
  };

  if (itemType in filters) {
    return this.items.filter(filters[itemType]).length;
  }
  throw new Error(itemType + ' is not a filter');
};

model.changeItem = function (pos, text, date) {
  this.items[pos].itemText = text;
  this.items[pos].itemDate = date;
};

model.deleteItem = function (pos) {
  this.items.splice(pos, 1);
};

model.toggleComplete = function (pos) {
  this.items[pos].completed = !this.items[pos].completed;
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
  return $('<i id="delete" class="fa fa-window-close"></i>');
};

view.createEditBtn = function () {
  return $('<i id="edit" class="fa fa-pencil-square-o"></i>');
};

view.createDateTxt = function (item) {
  var $dateTxt = $('<small></small>');
  var dueDate = dateUtils.fmtDueDate(item.itemDate);
  if (item.completed || this.todoScreen === 'Expired') {
    $dateTxt.addClass('strike');
  }
  $dateTxt.text(dueDate);
  if ($dateTxt.text() === 'a few seconds ago') {
    $dateTxt.text('Today');
  }
  return $dateTxt;
};

view.createItemIcon = function (item) {
  var $itemIcon = $('<i id="incomplete" class="fa fa-circle-o"></i>');
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
  var $itemTxt = $('<span></span>');
  if (item.completed || view.todoScreen === 'Expired') {
    $itemTxt.addClass('strike');
  }
  $itemTxt.text(item.itemText);
  return $itemTxt;
};

view.createItem = function (item, pos) {
  var $li = $('<li class="column columns"></li>');
  $li.attr('id', pos);
  $('.list ul').append($li);
  $li.append(this.createItemIcon(item));
  $li.append(this.createItemTxt(item));
  $li.append(this.createDateTxt(item));
  $li.append(this.createEditBtn());
  $li.append(this.createDeleteBtn());
};

view.createInputField = function (pos) {
  var $inputField = $('<input type="text" class="edit-txt input column is-4">');
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
  var $dateField = $('<input type="date" class="edit-date input column is-3">');
  if (model.items[pos].itemDate === '') {
    $dateField.attr('placeholder', 'DD/MM/YYYY');
  } else {
    $dateField.val(model.items[pos].itemDate);
  }
  return $dateField;
};

view.createSaveBtn = function (pos) {
  return $('<i id="save" class="fa fa-floppy-o"></i>');
};

view.enterListener = function () {
  var enterPress = function (e) {
    var itemTxt = $('#item-txt').val();
    var invalidItemDate = !dateUtils.isValidDate($('#date-txt').val());
    if (e.which === 13 || e.keyCode === 13) {
      if (itemTxt === '') {
        alert('Please enter a valid 2-Do');
      } else if (invalidItemDate) {
        alert('Please enter a valid date');
      } else if ($('input').is('.edit-txt') || $('input').is('.edit-date')) {
        handlers.saveItem($('input').parent().attr('id'));
      } else {
        handlers.addItem();
      }
    }
  };
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
  var $inputText = $('#item-txt');
  var $inputDate = $('#date-txt');
  model.addItem($inputText.val(), $inputDate.val());
  $inputText.val('');
  $inputDate.val('');
  view.displayItems();
};

handlers.changeItem = function (pos) {
  var $itemID = $('#' + pos);
  $itemID.html('');
  $itemID.append(view.createInputField(pos));
  $itemID.append(view.createDateField(pos));
  $itemID.append(view.createSaveBtn(pos));
  $itemID.append(view.createDeleteBtn());
};

handlers.saveItem = function (pos) {
  var editInputTxt = $('#' + pos).find('.edit-txt').val();
  var editInputDate = $('#' + pos).find('.edit-date').val();

  if (editInputTxt === '') {
    alert('Please enter a valid 2-do item');
  } else if (!dateUtils.isValidDate(editInputDate)) {
    alert('Please enter a valid date');
  } else {
    model.changeItem(pos, editInputTxt, editInputDate);
    view.displayItems();
  }
};

handlers.deleteItem = function (pos) {
  model.deleteItem(pos);
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

$(document).ready(function () {
  view.setUpEvents();
  view.enterListener();
  view.toggleStates();
}
);
