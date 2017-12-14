var view = (function (model, $, dateUtils) {
  var todoScreen = 'All';

  var createItemIcon = function (item) {
    var $itemIcon = $('<i id="incomplete" class="fa fa-circle-o column is-1"></i>');

    if (item.completed) {
      $itemIcon.toggleClass('fa-circle-o fa-check-circle-o');
      $itemIcon.attr('id', 'complete');
    } else if (todoScreen === 'Urgent') {
      $itemIcon.addClass('fa-exclamation-triangle').removeClass('fa-circle-o');
    } else if (todoScreen === 'Expired') {
      $itemIcon.addClass('fa-exclamation');
    }
    return $itemIcon;
  };

  var createItemTxt = function (item) {
    var $itemTxt = $('<span class="column is-7"></span>');

    if (item.completed || todoScreen === 'Expired') {
      $itemTxt.addClass('strike');
    }
    $itemTxt.text(item.itemText);
    return $itemTxt;
  };

  var createDateTxt = function (item) {
    var $dateTxt = $('<small class="column is-3"></small>');
    var dueDate = dateUtils.fmtDueDate(item.DateTime).from(dateUtils.todayInMS());

    if (item.completed || todoScreen === 'Expired') {
      $dateTxt.addClass('strike');
    }
    $dateTxt.text(dueDate);
    return $dateTxt;
  };

  var createEditBtn = function () {
    return $('<i id="edit" class="fa fa-pencil-square-o column is-1"></i>');
  };

  var createDeleteBtn = function () {
    return $('<i id="delete" class="fa fa-window-close column"></i>');
  };

  var createItem = function (item, pos) {
    var $li = $('<li class="column columns is-12"></li>');
    $li.attr('id', pos);
    $li.append(createItemIcon(item));
    $li.append(createItemTxt(item));
    $li.append(createDateTxt(item));
    $li.append(createEditBtn());
    $li.append(createDeleteBtn());
    $('.list ul').append($li);
  };

  var displayItems = function () {
    var counter = model.count('active');
    var counterComplete = model.count('completed');
    var counterUrgent = model.count('urgent');
    var counterExpired = model.count('expired');

    $('#All').text(model.items.length > 0 ? model.items.length + ' All' : 'All');
    $('#Active').text(counter > 0 ? counter + ' Active' : 'Active');
    $('#Completed').text(counterComplete > 0 ? counterComplete + ' Completed' : 'Completed');
    $('#Urgent').text(counterUrgent > 0 ? counterUrgent + ' Urgent' : 'Urgent');
    $('#Expired').text(counterExpired > 0 ? counterExpired + ' Expired' : 'Expired');

    $('.list ul').html('');

    model.items.forEach(function (item, pos) {
      var showAll = todoScreen === 'All';
      var showActive = todoScreen === 'Active' && item.isActive();
      var showCompleted = todoScreen === 'Completed' && item.completed;
      var showUrgent = todoScreen === 'Urgent' && item.isUrgent();
      var showExpired = todoScreen === 'Expired' && item.isExpired();

      if (showAll || showActive || showCompleted || showUrgent || showExpired) {
        createItem(item, pos);
      }
    });
  };

  var colorState = function () {
    $('#nav').children().each(function () {
      $(this).css({ 'background-color': '#fff' });
    });
  };

  var createInputField = function (pos) {
    var $inputField = $('<input type="text" class="edit-txt input column is-6 is-offset-1">');

    if (model.items[pos].itemText === '' || model.items[pos].itemText === undefined) {
      $inputField.val('');
    } else {
      $inputField.val(model.items[pos].itemText);
    }
    return $inputField;
  };

  var createDateField = function (pos) {
    var $dateField = $('<input type="date" class="edit-date input column is-3 is-offset-1">');

    if (model.items[pos].DateTime === '') {
      $dateField.attr('placeholder', 'DD/MM/YYYY');
    } else {
      $dateField.val(model.items[pos].DateTime);
    }
    return $dateField;
  };

  var createTimeField = function (pos) {
    var $timeField = $('<input type="text" class="edit-time input column is-1">');

    if (model.times[pos].DateTime === '') {
      $timeField.attr('placeholder', 'Due time');
    } else {
      $timeField.val(model.items[pos].DateTime);
    }
    return $timeField;
  };

  var createSaveBtn = function () {
    return $('<i id="save" class="fa fa-floppy-o column">');
  };

  var createEditTodo = function (pos) {
    createInputField(pos);
    createDateField(pos);
    createTimeField(pos);
    createSaveBtn();
    createDeleteBtn();
  };

  var createNotification = function (type) {
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
      $notif.addClass('is-danger');
      $notif.html('An item has expired');
    }
    $('h1').after($notif.hide().fadeIn(250));
    setTimeout(function () {
      $notif.fadeOut();
    }, 2500);
  };

  return {
    todoScreen: todoScreen,
    displayItems: displayItems,
    colorState: colorState,
    createEditTodo: createEditTodo,
    createNotification: createNotification
  };
}(model, $, dateUtils));
