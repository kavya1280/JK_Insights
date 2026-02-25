import { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Responsive from '@amcharts/amcharts5/themes/Responsive';

interface ChartData {
  category: string;
  value: number;
  date?: number;
  x?: number;
  y?: number;
}

interface ChartProps {
  data: ChartData[];
  type: 'bar' | 'pie' | 'donut' | 'line' | 'scatter';
  title?: string;
  categoryField?: string;
  valueField?: string;
  xField?: string;
  yField?: string;
}

export function Chart({
  data,
  type,
  title,
  categoryField = 'category',
  valueField = 'value',
  xField = 'x',
  yField = 'y'
}: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<am5.Root | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Dispose previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    // Create root element
    const root = am5.Root.new(chartRef.current);
    chartInstanceRef.current = root;

    // Set themes
    const myTheme = am5.Theme.new(root);
    myTheme.rule("AxisLabel", ["minor"]).setAll({
      dy: 1
    });

    root.setThemes([
      am5themes_Animated.new(root),
      myTheme,
      am5themes_Responsive.new(root)
    ]);

    // Create chart based on type
    if (type === 'bar') {
      createBarChart(root, data, categoryField, valueField);
    } else if (type === 'pie') {
      createPieChart(root, data, categoryField, valueField, false);
    } else if (type === 'donut') {
      createPieChart(root, data, categoryField, valueField, true);
    } else if (type === 'line') {
      createLineChart(root, data, categoryField, valueField);
    } else if (type === 'scatter') {
      createScatterChart(root, data, xField, yField);
    }

    return () => {
      root.dispose();
    };
  }, [data, type, categoryField, valueField, xField, yField]);

  const createBarChart = (root: am5.Root, chartData: ChartData[], catField: string, valField: string) => {
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: 'none',
        wheelY: 'none',
        paddingLeft: 0,
        paddingRight: 10,
        paddingTop: 10,
        paddingBottom: 0
      })
    );

    // Create axes
    const xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 30,
      minorGridEnabled: true
    });

    xRenderer.labels.template.setAll({
      rotation: -45,
      centerY: am5.p50,
      centerX: am5.p100,
      fontSize: 10
    });

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: catField,
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {})
      })
    );
    xAxis.data.setAll(chartData);

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    // Create series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Series',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: valField,
        categoryXField: catField,
        tooltip: am5.Tooltip.new(root, {
          labelText: '{valueY}'
        })
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 4,
      cornerRadiusTR: 4,
      fill: am5.color('#16C784'),
      stroke: am5.color('#16C784')
    });

    series.data.setAll(chartData);

    // Add XYCursor
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "zoomX"
    }));
    cursor.lineY.set("visible", false);
  };

  const createPieChart = (root: am5.Root, chartData: ChartData[], catField: string, valField: string, isDonut: boolean) => {
    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: isDonut ? am5.percent(50) : 0
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: valField,
        categoryField: catField,
        alignLabels: false
      })
    );

    series.labels.template.setAll({
      textType: 'circular',
      centerX: 0,
      centerY: 0,
      fontSize: 10
    });

    series.slices.template.setAll({
      stroke: am5.color('#ffffff'),
      strokeWidth: 2
    });

    // Set colors
    const colors = ['#16C784', '#0B1F3A', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
    series.get('colors')?.set('colors', colors.map(c => am5.color(c)));

    series.data.setAll(chartData);

    // Add legend
    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
        marginTop: 15,
        marginBottom: 15
      })
    );
    legend.data.setAll(series.dataItems);
  };

  const createLineChart = (root: am5.Root, chartData: ChartData[], catField: string, valField: string) => {
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: 'none',
        wheelY: 'none',
        paddingLeft: 0,
        paddingRight: 10,
        paddingTop: 10,
        paddingBottom: 0
      })
    );

    // Create axes
    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: catField,
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 30
        }),
        tooltip: am5.Tooltip.new(root, {})
      })
    );
    xAxis.data.setAll(chartData);

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    // Create series
    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'Series',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: valField,
        categoryXField: catField,
        tooltip: am5.Tooltip.new(root, {
          labelText: '{valueY}'
        })
      })
    );

    series.strokes.template.setAll({
      stroke: am5.color('#16C784'),
      strokeWidth: 3
    });

    series.bullets.push(() => {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: am5.color('#0B1F3A'),
          stroke: am5.color('#16C784'),
          strokeWidth: 2
        })
      });
    });

    series.data.setAll(chartData);

    // Add XYCursor
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "zoomX"
    }));
    cursor.lineY.set("visible", false);
  };

  const createScatterChart = (root: am5.Root, chartData: ChartData[], xF: string, yF: string) => {
    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: 'none',
        wheelY: 'none',
        paddingLeft: 0,
        paddingRight: 10,
        paddingTop: 10,
        paddingBottom: 0
      })
    );

    // Create axes
    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );

    // Create series
    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'Series',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: yF,
        valueXField: xF,
        tooltip: am5.Tooltip.new(root, {
          labelText: 'X: {valueX}, Y: {valueY}'
        })
      })
    );

    series.strokes.template.set('visible', false);

    series.bullets.push(() => {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 4,
          fill: am5.color('#16C784'),
          stroke: am5.color('#0B1F3A'),
          strokeWidth: 1
        })
      });
    });

    series.data.setAll(chartData);

    // Add XYCursor
    const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
      behavior: "zoomX"
    }));
    cursor.lineY.set("visible", false);
  };

  return (
    <div className="chart-container h-[400px] flex flex-col">
      {title && <h4 className="chart-title text-sm font-semibold mb-2">{title}</h4>}
      <div ref={chartRef} className="chart-canvas flex-1 w-full" />
    </div>
  );
}
