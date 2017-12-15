var itemStorage = (function (_) {
  var setItem = function (key, item) {
    localStorage.setItem(key, JSON.stringify({
      itemText: item.itemText,
      DateTime: item.DateTime._i,
      completed: item.completed,
      itemID: item.itemID
    }));
  };

  var getItem = function (key) {
    return JSON.parse(localStorage.getItem(key));
  };

  var removeItem = function (key) {
    localStorage.removeItem(key);
  };

  var getItemDicts = function () {
    if (localStorage.length === 0) {
      return [];
    }
    return Object.keys(localStorage).map(getItem);
  };

  return {
    setItem: setItem,
    getItem: getItem,
    removeItem: removeItem,
    getItemDicts: getItemDicts
  };
}(_));
