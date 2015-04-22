(function (homeCharts) {
    'use strict';
    function defaultChart(label, colour, data) {
        var result = {
            data: data,
            series: [
                {
                    y: "val_0",
                    label: label,
                    color: colour,
                    type: "area",
                    id: "series_0",
                    striped: true,
                },
            ],
            axes: { x: { type: "linear", key: "x", labelFunction: function (value) { return +(this.ticks - value); } }, y: { type: "linear" } },
        };

        return result; 
    }

    function addSeries(chart, label, colour) {
        chart.series.push({
            y: "val_1",
            label: label,
            color: colour,
            type: "line",
            axis: "y",
            id: "series_1",
            striped: true,
        });
    }

    function defaultPointsChart(data) {
        var chart = defaultChart("Points Used", "#f18bbd", data);
        addSeries("Points Estimated", "#ae8bf1");
    }

    homeCharts.charts = function () {
        var result = [];
        result.push(defaultPointsChart($scope.sprintUsageData));
        result.push(defaultPointsChart($scope.sprintAvgData));
        result.push(defaultPointsChart($scope.sprintPerDayData));
        result.push(defaultChart("Unexpected Points", "#4d90ed", $scope.sprintUnexpectedData));
        result.push(defaultChart("Difference", "#4d90ed", $scope.sprintDiffData));
        return result;
    }
}(window.homeCharts = window.homeCharts || {}));