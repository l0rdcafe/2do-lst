var model = (function (dateUtils, itemStorage, _) {
  var items = [];
  var nextID = 1;

  var addItem = function (text, date) {
    var item = model.createItem(text, date, nextID, false);
    items.push(item);
    itemStorage.setItem(item.itemID, item);
    nextID += 1;

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
      return items.filter(filters[itemType]).length;
    }
    throw new Error(itemType + ' is not a filter');
  };

  var changeItem = function (pos, text, date) {
    var item = items[pos];
    item.itemText = text;
    item.DateTime = dateUtils.fmtDueDate(date);
    itemStorage.setItem(item.itemID, item);
  };

  var deleteItem = function (pos) {
    var item = items[pos];
    items.splice(pos, 1);
    itemStorage.removeItem(item.itemID);
  };

  var toggleComplete = function (pos) {
    var item = items[pos];
    item.completed = !item.completed;
    itemStorage.setItem(item.itemID, item);
  };

  var toggleAll = function () {
    var totalItems = items.length;
    var completedItemsNum = items.filter(function (item) {
      return item.completed;
    }).length;

    if (totalItems === completedItemsNum) {
      items.forEach(function (item) {
        item.completed = false;
      });
    } else {
      items.forEach(function (item) {
        item.completed = true;
      });
    }
    items.forEach(function (item) {
      itemStorage.setItem(item.itemID, item);
    });
  };

  var syncStorage = function () {
    var itemDicts = itemStorage.getItemDicts();

    if (itemDicts.length === 0) {
      nextID = 1;
      items = [];
    } else {
      itemDicts.forEach(function (dict) {
        var item = itemStorage.getItem(dict.itemID);
        createItem(item.itemText, item.DateTime, item.itemID, item.completed);
        items.push(item);
      });
      items = _.sortBy(items, function (i) { return i.itemID; });
      nextID = _.max(items.map(function (i) { return i.itemID; })) + 1;
    }
    return items;
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
    createItem: createItem,
    syncStorage: syncStorage
  };
}(dateUtils, itemStorage, _));
