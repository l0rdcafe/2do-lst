var dateUtils = (function (moment) {
  var today = function () {
    return moment();
  };

  var todayInMS = function () {
    return moment().valueOf();
  };

  var dayInMS = function () {
    return moment.duration(1, 'days').asMilliseconds();
  };

  var isValidDate = function (dateVal) {
    return moment(dateVal, 'DD-MM-YYYY').isValid();
  };

  var isAfterNow = function (dateVal) {
    return dateVal.valueOf() - this.todayInMS() > this.dayInMS();
  };

  var isNow = function (dateVal) {
    return dateVal.valueOf() - this.todayInMS() < this.dayInMS() && dateVal.valueOf() - this.todayInMS() > 0;
  };

  var isBeforeNow = function (dateVal) {
    return dateVal.valueOf() - this.todayInMS() <= 0;
  };

  var fmtDueDate = function (dateVal) {
    return moment(dateVal, 'DD-MM-YYYY HH:mm a');
  };

  var itemTimeInMS = function (timeVal) {
    return timeVal.valueOf();
  };

  return {
    today: today,
    todayInMS: todayInMS,
    dayInMS: dayInMS,
    isValidDate: isValidDate,
    isAfterNow: isAfterNow,
    isNow: isNow,
    isBeforeNow: isBeforeNow,
    fmtDueDate: fmtDueDate,
    itemTimeInMS: itemTimeInMS
  };
}(moment));
