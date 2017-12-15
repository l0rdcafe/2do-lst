var model = (function (dateUtils, itemStorage, _) {
  var items = [];
  var nextID = 1;

  var addItem = function (text, date) {
    var item = createItem(text, date, model.nextID, false);
    model.items.push(item);
    itemStorage.setItem(item.itemID, item);
    model.nextID += 1;

    return item;
  };

  var createItem = function (text, timeText, id, completed) {
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

  var count = function (itemType) {
    var filters = {
      expired: function (i) { return i.isExpired(); },
      active: function (i) { return i.isActive(); },
      urgent: function (i) { return i.isUrgent(); },
      completed: function (i) { return i.completed; }
    };

    if (itemType in filters) {
      return model.items.filter(filters[itemType]).length;
    }
    throw new Error(itemType + ' is not a filter');
  };

  var changeItem = function (pos, text, date) {
    var item = model.items[pos];
    item.itemText = text;
    item.DateTime = dateUtils.fmtDueDate(date);
    itemStorage.setItem(item.itemID, item);
  };

  var deleteItem = function (pos) {
    var item = model.items[pos];
    model.items.splice(pos, 1);
    itemStorage.removeItem(item.itemID);
  };

  var toggleComplete = function (pos) {
    var item = model.items[pos];
    item.completed = !item.completed;
    itemStorage.setItem(item.itemID, item);
  };

  var toggleAll = function () {
    var totalItems = model.items.length;
    var completedItemsNum = model.items.filter(function (item) {
      return item.completed;
    }).length;

    if (totalItems === completedItemsNum) {
      model.items.forEach(function (item) {
        item.completed = false;
      });
    } else {
      model.items.forEach(function (item) {
        item.completed = true;
      });
    }
    model.items.forEach(function (item) {
      itemStorage.setItem(item.itemID, item);
    });
  };

  var syncStorage = function () {
    var itemDicts = itemStorage.getItemDicts();

    if (itemDicts.length === 0) {
      model.nextID = 1;
      model.items = [];
    } else {
      itemDicts.forEach(function (dict) {
        var item = createItem(dict.itemText, dict.DateTime, dict.itemID, dict.completed);
        model.items.push(item);
      });

      model.items = _.sortBy(items, function (i) { return i.itemID; });
      model.nextID = _.max(items.map(function (i) { return i.itemID; })) + 1;
    }
    return model.items;
  };

  return {
    items: items,
    nextID: nextID,
    addItem: addItem,
    changeItem: changeItem,
    deleteItem: deleteItem,
    toggleComplete: toggleComplete,
    toggleAll: toggleAll,
    count: count,
    syncStorage: syncStorage
  };
}(dateUtils, itemStorage, _));
