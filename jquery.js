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
  isItemActive: function (dateVal) {
    return !this.isItemExpired(dateVal);
  },
  isItemUrgent: function (dateVal) {
    return moment(dateVal, 'DD-MM-YYYY').isSame(this.today(), 'day');
  },
  isItemExpired: function (dateVal) {
    return moment(dateVal, 'DD-MM-YYYY').isBefore(this.today(), 'day');
  }
};

model.items = [];

model.addItem = function (text, date) {
  this.items.push({
    itemText: text,
    itemDate: date,
    completed: false
  });
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

view.viewState = 'All';

view.displayItems = function () {
  var counter = model.items
        .filter(function (i) {
          return !i.completed && dateUtils.isItemActive(i.itemDate);
        }).length;
  var counterComplete = model.items
        .filter(function (i) {
          return i.completed;
        }).length;
  var counterUrgent = model.items
        .filter(function (i) {
          return !i.completed && dateUtils.isItemUrgent(i.itemDate);
        }).length;
  var counterExpired = model.items
        .filter(function (i) {
          return !i.completed && dateUtils.isItemExpired(i.itemDate);
        }).length;

  $('#all').text(model.items.length > 0 ? model.items.length + ' All' : 'All');
  $('#active').text(counter > 0 ? counter + ' Active' : 'Active');
  $('#completed').text(counterComplete > 0 ? counterComplete + ' Completed' : 'Completed');
  $('#expired').text(counterExpired > 0 ? counterExpired + ' Expired' : 'Expired');
  $('#urgent').text(counterUrgent > 0 ? counterUrgent + ' Urgent' : 'Urgent');

  $('.list ul').html('');

  model.items.forEach(function (item, pos) {
    var showAll = view.viewState === 'All';
    var showActive = view.viewState === 'Active' && dateUtils.isItemActive(model.items[pos].itemDate);
    var showCompleted = view.viewState === 'Completed' && item.completed;
    var showUrgent = view.viewState === 'Urgent' && dateUtils.isItemUrgent(model.items[pos].itemDate);
    var showExpired = view.viewState === 'Expired' && dateUtils.isItemExpired(model.items[pos].itemDate);

    if (showAll || showActive || showCompleted || showUrgent || showExpired) {
      view.createItem(item, pos);
    }
  });
};

view.createDeleteBtn = function () {
  var deleteBtn = $('<i></i>');
  deleteBtn.addClass('fa fa-window-close');
  deleteBtn.attr('id', 'delete');
  return deleteBtn;
};

view.createEditBtn = function () {
  var $editBtn = $('<i id="edit" class="fa fa-pencil-square-o"></i>');
  return $editBtn;
};

view.createDateTxt = function (item) {
  var $dateTxt = $('<small></small>');
  var dueDate = moment(item.itemDate, 'DD-MM-YYYY')
        .startOf('day')
        .from(dateUtils.today().startOf('day'));
  if (item.completed || this.viewState === 'Expired') {
    $dateTxt.addClass('strike');
  }
  $dateTxt.text(dueDate);
  if ($dateTxt.text() === 'a few seconds ago') {
    $dateTxt.text('Today');
  }
  return $dateTxt;
};

view.createItemIcon = function (item) {
  var $itemIcon = $('<i id="false" class="fa fa-circle-o"></i>');
  if (item.completed) {
    $itemIcon.toggleClass('fa-circle-o fa-check-circle-o');
    $itemIcon.attr('id', 'true');
  } else if (view.viewState === 'Urgent') {
    $itemIcon.addClass('fa-exclamation-triangle').removeClass('fa-circle-o');
  } else if (view.viewState === 'Expired') {
    $itemIcon.addClass('fa-exclamation');
  }
  return $itemIcon;
};

view.createItemTxt = function (item) {
  var $itemTxt = $('<span></span>');
  if (item.completed || view.viewState === 'Expired') {
    $itemTxt.addClass('strike');
  }
  $itemTxt.text(item.itemText);
  return $itemTxt;
};

view.createItem = function (item, pos) {
  var $li = $('<li></li>');
  $li.attr('id', pos);
  $('.list ul').append($li);
  $($li.first()).before(this.createItemIcon(item));
  $li.append(this.createItemTxt(item));
  $li.append(this.createDateTxt(item));
  $li.append(this.createEditBtn());
  $li.append(this.createDeleteBtn());
};

view.createInputField = function (pos) {
  var $inputField = $('<input>');
  $inputField.attr('type', 'text');
  $inputField.addClass('edit-txt');
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
  var $dateField = $('<input>');
  $dateField.attr('type', 'date');
  $dateField.addClass('edit-date');
  if (model.items[pos].itemDate === '') {
    $dateField.attr('placeholder', 'DD/MM/YYYY');
  } else {
    $dateField.val(model.items[pos].itemDate);
  }
  return $dateField;
};

view.createSaveBtn = function (pos) {
  var $saveBtn = $('<i></i>');
  $saveBtn.addClass('fa fa-floppy-o');
  $saveBtn.attr('id', 'save');
  return $saveBtn;
};

view.enterListener = function () {
  var enterPress = function (e) {
    if (e.which === 13 || e.keyCode === 13) {
      if ($('#item-txt').val() === '') {
        alert('Please enter a valid 2-Do');
      } else if (!dateUtils.isValidDate($('#date-txt').val())) {
        alert('Please enter a valid date');
      } else {
        handlers.addItem();
      }
    }
  };
  $('#item-txt').on('keypress', enterPress);
  $('#date-txt').on('keypress', enterPress);
};

view.colorState = function () {
  $('#nav').children().each(function () {
    $(this).css({ 'background-color': '#fff' });
  });
};

view.toggleStates = function () {
  var stateToggle = function (e) {
    var elementClicked = e.target;
    view.colorState();
    if (elementClicked.id === 'all') {
      view.viewState = 'All';
    } else if (elementClicked.id === 'active') {
      view.viewState = 'Active';
    } else if (elementClicked.id === 'completed') {
      view.viewState = 'Completed';
    } else if (elementClicked.id === 'urgent') {
      view.viewState = 'Urgent';
    } else if (elementClicked.id === 'expired') {
      view.viewState = 'Expired';
    }
    elementClicked.style.backgroundColor = '#aaa3';
    view.displayItems();
  };
  $('#nav').on('click', stateToggle);
};

view.setUpEvents = function () {
  $('.list ul').on('click', function (event) {
    var clickedElm = event.target;
    if (clickedElm.id === 'delete') {
      handlers.deleteItem(clickedElm.parentNode.id);
    } else if (clickedElm.id === 'false' || clickedElm.id === 'true') {
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
  var $itemID = $('pos');
  $itemID.html('');
  $itemID.append(view.createInputField(pos));
  $itemID.append(view.createDateField(pos));
  $itemID.append(view.createSaveBtn(pos));
  $itemID.append(view.createDeleteBtn());
};

handlers.saveItem = function (pos) {
  var editInputTxt = $('pos').find('.edit-txt').val();
  var editInputDate = $('pos').find('.edit-date').val();

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

view.setUpEvents();
view.enterListener();
view.toggleStates();
