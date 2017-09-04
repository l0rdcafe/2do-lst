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
  var items = this.items.length;
  var completed = 0;
  this.items.each(function (item) {
    if (item.completed) {
      completed += 1;
    }
  });
  this.items.each(function (items) {
    if (completed === items) {
      item.completed = false;
    } else {
      item.completed = true;
    }
  });
};

view.displayItems = function () {
  var $list = $('.list ul');
  var counter = 0;
  var counterComplete = 0;
  var counterUrgent = 0;
  var counterExpired = 0;
  $list.text('');
  model.items.each(function (item, pos) {
    if (!item.completed && dateUtils.isItemExpired(item.itemDate)) {
      counterExpired += 1;
    } else if (!item.completed && dateUtils.isItemUrgent(item.itemDate)) {
      counterUrgent += 1;
    } else if (!item.completed && dateUtils.isItemActive(item.itemDate)) {
      counter += 1;
    } else if (item.completed) {
      counterComplete += 1;
    }

    if (viewState === 'All' || viewState === undefined) {
      this.createItem(item, pos);
    } else if (viewState === 'Completed' && item.completed) {
      this.createItem(item, pos);
    } else if (
      viewState === 'Active' &&
      !item.completed &&
      dateUtils.isItemActive(model.items[pos].itemDate)
    ) {
      this.createItem(item, pos);
    } else if (
      viewState === 'Urgent' &&
      dateUtils.isItemUrgent(model.items[pos].itemDate) &&
      !item.completed
    ) {
      this.createItem(item, pos);
    } else if (
      viewState === 'Expired' &&
      dateUtils.isItemExpired(model.items[pos].itemDate) &&
      !item.completed
    ) {
      this.createItem(item, pos);
    }
  }, this);
  $('#all').text(model.items.length + ' All');
  $('#active').text(counter + ' Active');
  $('#completed').text(counterComplete + ' Completed');
  $('#expired').text(counterExpired + ' Expired');
  $('#urgent').text(counterUrgent + ' Urgent');

  if (model.items.length === 0) {
    $('#all').text('All');
  }

  if (counterComplete === 0) {
    $('#completed').text('Completed');
  }

  if (counterUrgent === 0) {
    $('#urgent').text('Urgent');
  }

  if (counterExpired === 0) {
    $('#expired').text('Expired');
  }
};

view.createDeletBtn = function () {
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
  $smol.text(
    moment(item.itemDate, 'DD-MM-YYYY')
      .startOf('day')
      .from(dateUtils.today().startOf('day'))
  );
  if ($smol.text() === 'a few seconds ago') {
    $smol.text('Today');
  }
  $list.append($li);
  $li.before($itemIcon, $list.first());
  $li.append($text);
  $li.append($smol);
  $li.append($editBtn);
  $li.append(this.createDeleteBtn());
};
