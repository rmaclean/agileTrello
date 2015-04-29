(function (homeCharts) {
    'use strict';
    function defaultChart(chartLabel, seriesLabel, colour, data) {
        var result = {
            label : chartLabel,
            data: [
                 { x: 0, value: 4 },
                 { x: 1, value: 3 },
                 { x: 2, value: 5 },
                 { x: 3, value: 7 },
                 { x: 4, value: 3 },
            ],
            series: [
                {
                    y: "val_0",
                    label: seriesLabel,
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
    
    function defaultPointsChart(chartLabel, data) {
        var chart = defaultChart(chartLabel, "Points Used", "#f18bbd", data);
        addSeries(chart, "Points Estimated", "#ae8bf1");
        return chart;
    }

    homeCharts.charts = function ($scope) {
        $scope.charts = [];
        $scope.charts.push(defaultPointsChart("Usage", $scope.sprintUsageData));
        $scope.charts.push(defaultPointsChart("Average", $scope.sprintAvgData));
        $scope.charts.push(defaultPointsChart("Per Day", $scope.sprintPerDayData));
        $scope.charts.push(defaultChart("Unexpected", "Unexpected Points", "#4d90ed", $scope.sprintUnexpectedData));
        $scope.charts.push(defaultChart("Difference", "Difference", "#4d90ed", $scope.sprintDiffData));
    }
}(window.homeCharts = window.homeCharts || {}));