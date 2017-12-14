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
    var keyData = JSON.parse(localStorage.getItem(key));
    return keyData;
  };

  var removeItem = function (key) {
    localStorage.removeItem(key);
  };

  var getItemDicts = function () {
    if (localStorage.length === 0) {
      return [];
    }
    return _.values(localStorage);
  };

  return {
    setItem: setItem,
    getItem: getItem,
    removeItem: removeItem,
    getItemDicts: getItemDicts
  };
}(_));
