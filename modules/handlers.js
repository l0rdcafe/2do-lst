var handlers = (function (model, view, $, dateUtils) {
  var timers = {};

  var scheduleTimer = function (item) {
    timers[item.itemID] = setTimeout(function () {
      view.createNotification('expired');
      view.displayItems();
    }, item.DateTime - dateUtils.todayInMS());
  };

  var addItem = function () {
    var $textField = $('#item-txt');
    var $dateField = $('#date-txt');
    var $timeField = $('#time-txt');
    var $inputDate = $dateField.pickadate('picker');
    var $inputTime = $timeField.pickatime('picker');
    var itemDate = $inputDate.get('select', 'dd-mm-yyyy');
    var timeInput = $inputTime.get('select', 'HH:i A');
    var itemTime = itemDate + ' ' + timeInput;
    var formattedItemTime = dateUtils.fmtDueDate(itemTime);
    var item = model.addItem($textField.val(), itemTime);
    $textField.val('');
    $dateField.val('');
    $timeField.val('');

    if (!dateUtils.isBeforeNow(formattedItemTime)) {
      scheduleTimer(item);
    }

    view.displayItems();
  };

  var changeItem = function (pos) {
    var $itemID = $('#' + pos);
    $itemID.html('');
    $itemID.append(view.createEditTodo(pos));
    $('.edit-date').pickadate();
    $('.edit-time').pickatime();
  };

  var saveItem = function (pos) {
    var editInputTxt = $('#' + pos).find('.edit-txt').val();
    var editDateField = $('#' + pos).find('.edit-date');
    var editTimeField = $('#' + pos).find('.edit-time');
    var timePicker = $(editTimeField).pickatime('picker');
    var picker = $(editDateField).pickadate('picker');
    var editInputDate = picker.get('select', 'dd-mm-yyyy');
    var editInputTime = timePicker.get('select', 'HH:i A');
    var editedTime = editInputDate + ' ' + editInputTime;
    var formattedEditedTime = dateUtils.fmtDueDate(editedTime);
    var item = model.items[pos];
    var currentTimers = timers;

    if (editInputTxt === '') {
      view.createNotification('text');
    } else if (!dateUtils.isValidDate(editInputDate)) {
      view.createNotification('date');
    } else if (editInputTime === '') {
      view.createNotification('time');
    } else {
      model.changeItem(pos, editInputTxt, editedTime);

      if (item.itemID in currentTimers) {
        clearTimeout(currentTimers[item.itemID]);
        delete currentTimers[item.itemID];
      }

      if (!dateUtils.isBeforeNow(formattedEditedTime)) {
        scheduleTimer(item);
      }
    }

    view.displayItems();
  };

  var deleteItem = function (pos) {
    var item = model.items[pos];
    var currentTimers = timers;
    model.deleteItem(pos);

    if (item.itemID in currentTimers) {
      clearTimeout(currentTimers[item.itemID]);
      delete currentTimers[item.itemID];
    }
    view.displayItems();
  };

  var toggleComplete = function (pos) {
    model.toggleComplete(pos);
    view.displayItems();
  };

  var toggleAll = function () {
    $('#toggle').toggleClass('fa fa-toggle-off fa fa-toggle-on');
    model.toggleAll();
    view.displayItems();
  };

  var sortItems = function () {
    $('#list').sortable()
      .disableSelection()
      .on('sortupdate', function () {
        model.items = $.makeArray($('#list li'))
          .map(function (li) {
            return model.items[li.id];
          });
      });
  };

  var enterListener = function () {
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
          addItem();
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

  var toggleStates = function () {
    var stateToggle = function (e) {
      var elementClicked = e.target;
      view.colorState();
      view.todoScreen = elementClicked.id;
      elementClicked.style.backgroundColor = '#aaa3';
      view.displayItems();
    };

    $('#nav').on('click', stateToggle);
  };

  var setUpEvents = function () {
    $('.list ul').on('click', function (event) {
      var clickedElm = event.target;

      if (clickedElm.id === 'delete') {
        deleteItem(clickedElm.parentNode.id);
      } else if (clickedElm.id === 'complete' || clickedElm.id === 'incomplete') {
        toggleComplete(clickedElm.parentNode.id);
      } else if (clickedElm.id === 'edit') {
        changeItem(clickedElm.parentNode.id);
      } else if (clickedElm.id === 'save') {
        saveItem(clickedElm.parentNode.id);
      }
    });

    $('#toggle').click(function () {
      toggleAll();
    });
  };

  var init = function () {
    var items = model.syncStorage();
    items.forEach(function (item) {
      scheduleTimer(item);
    });
  };

  return {
    enterListener: enterListener,
    setUpEvents: setUpEvents,
    sortItems: sortItems,
    toggleStates: toggleStates,
    timers: timers,
    scheduleTimer: scheduleTimer,
    init: init
  };
}(model, view, $, dateUtils));

$(document).ready(function () {
  handlers.setUpEvents();
  handlers.enterListener();
  handlers.toggleStates();
  handlers.sortItems();
  handlers.init();
}
);
