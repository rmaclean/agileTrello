(function (homeCharts) {
    'use strict';
    function defaultChart(chartLabel, seriesLabel, colour, data) {
        var result = {
            data: data,
            options : {
                label: chartLabel,
                series: [
                    {
                        y: "val_0",
                        label: seriesLabel,
                        color: colour,
                        type: "area",
                        id: "series_0",
                        striped: false,
                    },
                ],
                axes: { x: { type: "linear", key: "x", labelFunction: function (value) { return +(data.length - value); } }, y: { type: "linear" } },
                columnsHGap: 1,
            },
        };
            
        return result; 
    }

    function addSeries(chart, label, colour) {
        chart.options.series.push({
            y: "val_1",
            label: label,
            color: colour,
            type: "line",
            axis: "y",
            id: "series_1",
            striped: false,
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