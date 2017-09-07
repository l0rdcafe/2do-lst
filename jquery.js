var model = {};
var view = {};
var handlers = {};
var viewState = 'All';
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
    $.each(this.items, function (item) {
      item.completed = false;
    });
  } else {
    $.each(this.items, function (item) {
      item.completed = true;
    });
  }
};

view.displayItems = function () {
  var $list = $('.list ul');
  var counter = 0;
  var counterComplete = 0;
  var counterUrgent = 0;
  var counterExpired = 0;
  var allText;
  var activeText;
  var completeText;
  var urgentText;
  var expiredText;
  $list.html('');
  $.each(model.items, function (item, pos) {
    var showAll = viewState === 'All';
    var showActive =
      viewState === 'Active' &&
      dateUtils.isItemActive(model.items[pos].itemDate);
    var showCompleted = viewState === 'Completed' && item.completed;
    var showUrgent =
      viewState === 'Urgent' &&
      dateUtils.isItemUrgent(model.items[pos].itemDate);
    var showExpired =
      viewState === 'Expired' &&
      dateUtils.isItemExpired(model.items[pos].itemDate);

    if (!item.completed && dateUtils.isItemExpired(item.itemDate)) {
      counterExpired += 1;
    } else if (!item.completed && dateUtils.isItemUrgent(item.itemDate)) {
      counterUrgent += 1;
    } else if (!item.completed && dateUtils.isItemActive(item.itemDate)) {
      counter += 1;
    } else if (item.completed) {
      counterComplete += 1;
    }

    if (showAll || showActive || showCompleted || showUrgent || showExpired) {
      view.createItem(item, pos);
    }
  });

  allText = model.items.length > 0 ? model.items.length + ' All' : 'All';
  $('#all').text(allText);

  activeText = counter > 0 ? counter + ' Active' : 'Active';
  $('#active').text(activeText);

  completeText =
    counterComplete > 0 ? counterComplete + ' Completed' : 'Completed';
  $('#completed').text(completeText);

  expiredText = counterExpired > 0 ? counterExpired + ' Expired' : 'Expired';
  $('#expired').text(expiredText);

  urgentText = counterUrgent > 0 ? counterUrgent + ' Urgent' : 'Urgent';
  $('#urgent').text(urgentText);
};

view.createDeleteBtn = function () {
  var deleteBtn = $('<i></i>');
  deleteBtn.addClass('fa fa-window-close');
  deleteBtn.attr('id', 'delete');
  return deleteBtn;
};

view.createItem = function (item, pos) {
  var $list = $('.list ul');
  var $li = $('<li></li>');
  var $editBtn = $('<i></i>');
  var $smol = $('<small></small>');
  var $text = $('<span></span>');
  var $itemIcon = $('<i></i>');
  var dateText;

  $editBtn.addClass('fa fa-pencil-square-o');
  $editBtn.attr('id', 'edit');
  if (item.completed) {
    $itemIcon.addClass('fa fa-check-circle-o');
    $itemIcon.attr('id', 'true');
    $text.addClass('strike');
    $smol.addClass('strike');
  } else {
    $itemIcon.addClass('fa fa-circle-o');
    $itemIcon.attr('id', 'false');
  }

  if (viewState === 'Urgent') {
    $itemIcon.addClass('fa fa-exclamation-triangle');
  } else if (viewState === 'Expired') {
    $text.addClass('strike');
    $smol.addClass('strike');
    $itemIcon.addClass('fa fa-exclamation');
  }
  $li.attr('id', pos);
  $text.text(item.itemText);

  dateText = moment(item.itemDate, 'DD-MM-YYYY')
    .startOf('day')
    .from(dateUtils.today().startOf('day'));
  $smol.text(dateText);
  if ($smol.text() === 'a few seconds ago') {
    $smol.text('Today');
  }
  $list.append($li);
  $($li.first()).before($itemIcon);
  $li.append($text);
  $li.append($smol);
  $li.append($editBtn);
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
  function enterPress(e) {
    if (e.which === 13 || e.keyCode === 13) {
      if ($('#item-txt').val() === '') {
        alert('Please enter a valid 2-Do');
      } else if (!dateUtils.isValidDate($('#date-txt').val())) {
        alert('Please enter a valid date');
      } else {
        handlers.addItem();
      }
    }
  }
  $('#item-txt').on('keypress', enterPress);
  $('#date-txt').on('keypress', enterPress);
};

view.setUpEvents = function () {
  $('.list ul').on('click', function (event) {
    var clickedElm = event.target;
    var elmID = clickedElm.id;
    var itemID = clickedElm.parentNode.id;
    if (elmID === 'delete') {
      handlers.deleteItem(itemID);
    } else if (
      elmID === 'false' ||
      elmID === 'true' ||
      model.items[itemID].completed
    ) {
      handlers.toggleComplete(itemID);
    } else if (elmID === 'edit') {
      handlers.changeItem(itemID);
    } else if (elmID === 'save') {
      handlers.saveItem(itemID);
    }
  });
  $('#toggle').click(function () {
    handlers.toggleAll();
  });
};

handlers.addItem = function () {
  var $inputText = $('#item-txt').val();
  var $inputDate = $('#date-txt').val();
  model.addItem($inputText, $inputDate);
  $inputText = '';
  $inputDate = '';
  view.displayItems();
};

handlers.changeItem = function (pos) {
  var $itemID = $('pos');
  $itemID.html('');
  $itemID.append(view.createInputField(pos));
  $itemID.append(view.createDateField(pos));
  $itemID.append(view.createSaveBtn(pos));
  $itemID.append(view.createDeletBtn());
};

handlers.saveItem = function (pos) {
  var $editInput = $('pos').find('.edit-txt').val();
  var $editDate = $('pos').find('.edit-date').val();

  if ($editInput === '') {
    alert('Please enter a valid 2-do item');
  } else if (!dateUtils.isValidDate($editDate)) {
    alert('Please enter a valid date');
  } else {
    model.changeItem(pos, $editInput, $editDate);
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
