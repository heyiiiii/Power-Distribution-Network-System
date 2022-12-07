class Globals {
  static getOrigin() {
    const _location = location || window.location;
    if (_location.origin) {
      return _location.origin;
    } else {
      return _location.protocol + '//' + _location.host;
    }
  }

  static localeComparator(a, b) {
    if (typeof a === 'string') {
      return a.localeCompare(b, 'zh-CN');
    } else {
      return a > b ? 1 : a < b ? -1 : 0;
    }
  }

  static comparator(a, b) {
    if (typeof a === 'string') {
      return a.localeCompare(b, 'zh-CN');
    } else {
      return a > b ? 1 : a < b ? -1 : 0;
    }
  }

  static dzdFlowDiagram = null;

  static agGridLocaleText = {
    // for filter panel
    page: '页',
    more: '更多',
    to: '至',
    of: '第',
    next: '下一页',
    last: '尾页',
    first: '首页',
    previous: '前一页',
    loadingOoo: '正在加载...',

    // for set filter
    selectAll: '全选',
    searchOoo: '查找...',
    blanks: '空',

    // for number filter and text filter
    filterOoo: '过滤...',
    applyFilter: '应用...',
    equals: '相等',
    notEqual: '不等',

    // for number filter
    lessThan: '小于',
    greaterThan: '大于',
    lessThanOrEqual: '小于等于',
    greaterThanOrEqual: '大于等于',
    inRange: '区间',

    // for text filter
    contains: '包含',
    notContains: '不包含',
    startsWith: '以...开头',
    endsWith: '以...结束',

    // filter conditions
    andCondition: '与',
    orCondition: '或',

    // the header of the default group column
    group: '组',

    // tool panel
    columns: ' 选择列 ',
    filters: '过滤',
    rowGroupColumns: '列分组',
    rowGroupColumnsEmptyMessage: '拖动列到此处进行分组',
    valueColumns: 'laValue Cols',
    pivotMode: '分组模式',
    groups: '组',
    values: '值',
    pivots: 'Pivots',
    valueColumnsEmptyMessage: '拖动列进行统计',
    pivotColumnsEmptyMessage: '拖动到此处进行分组',
    toolPanelButton: '选择列',

    // other
    noRowsToShow: ' ',

    // enterprise menu
    pinColumn: '固定列',
    valueAggregation: '数值组合',
    autosizeThiscolumn: '本列自动适应宽度',
    autosizeAllColumns: '所有列自动调整宽度',
    groupBy: '分组',
    ungroupBy: '取消分组',
    resetColumns: '重置所有列',
    expandAll: '全部展开',
    collapseAll: '全部收起',
    toolPanel: '选择列',
    export: '导出',
    csvExport: '导出为CSV格式文件',
    excelExport: '导出为excel文件 (.xlsx)',
    excelXmlExport: '导出为xml文件 (.xml)',
    //  导出选中项
    excelSelectedExport: '导出选中项为excel文件(.xlsx)',

    // enterprise menu (charts)
    chartRange: '图表',

    columnRangeChart: 'laColumn',
    groupedColumnChart: 'laGrouped',
    stackedColumnChart: 'laStacked',
    normalizedColumnChart: 'la100% Stacked',

    barRangeChart: 'laBar',
    groupedBarChart: 'laGrouped',
    stackedBarChart: 'laStacked',
    normalizedBarChart: 'la100% Stacked',

    lineRangeChart: 'laLine',

    pieRangeChart: 'laPie',
    pieChart: 'laPie',
    doughnutChart: 'laDoughnut',

    areaRangeChart: 'laArea',
    areaChart: 'laArea',
    stackedAreaChart: 'laStacked',
    normalizedAreaChart: 'la100% Stacked',

    // enterprise menu pinning
    pinLeft: '固定到左端 &lt;&lt;',
    pinRight: '固定到右端 &gt;&gt;',
    noPin: '不固定 &lt;&gt;',

    // enterprise menu aggregation and status bar
    sum: '累加',
    min: '最小值',
    max: '最大值',
    none: '空',
    count: '计数',
    average: '平均值',

    // standard menu
    copy: '复制',
    copyWithHeaders: '复制(包含表头)',
    ctrlC: 'ctrl + C',
    paste: '粘贴',
    ctrlV: 'ctrl + V',

    // charts
    settings: '设置',
    data: 'laData',
    format: 'laFormat',
    categories: 'laCategories',
    series: 'laSeries',
    axis: 'laAxis',
    color: 'laColor',
    thickness: 'laThickness',
    xRotation: 'laX Rotation',
    yRotation: 'laY Rotation',
    ticks: 'laTicks',
    width: 'laWidth',
    length: 'laLength',
    padding: 'laPadding',
    chart: 'laChart',
    title: 'laTitle',
    font: 'laFont',
    top: 'laTop',
    right: 'laRight',
    bottom: 'laBottom',
    left: 'laLeft',
    labels: 'laLabels',
    size: 'laSize',
    legend: 'laLegend',
    position: 'laPosition',
    markerSize: 'laMarker Size',
    markerStroke: 'laMarker Stroke',
    markerPadding: 'laMarker Padding',
    itemPaddingX: 'laItem Padding X',
    itemPaddingY: 'laItem Padding Y',
    strokeWidth: 'laStroke Width',
    offset: 'laOffset',
    tooltips: 'laTooltips',
    offsets: 'laOffsets',
    callout: 'laCallout',
    markers: 'laMarkers',
    shadow: 'laShadow',
    blur: 'laBlur',
    xOffset: 'laX Offset',
    yOffset: 'laY Offset',
    lineWidth: 'laLine Width',
    normal: 'laNormal',
    bold: 'laBold',
    italic: 'laItalic',
    boldItalic: 'laBold Italic',
    fillOpacity: 'laFill Opacity',
    strokeOpacity: 'laLine Opacity',
    groupedColumnTooltip: 'laGrouped',
    stackedColumnTooltip: 'laStacked',
    normalizedColumnTooltip: 'la100% Stacked',
    groupedBarTooltip: 'laGrouped',
    stackedBarTooltip: 'laStacked',
    normalizedBarTooltip: 'la100% Stacked',
    pieTooltip: 'laPie',
    doughnutTooltip: 'laDoughnut',
    lineTooltip: 'laLine',
    groupedAreaTooltip: 'laGrouped',
    stackedAreaTooltip: 'laStacked',
    normalizedAreaTooltip: 'la100% Stacked'
  };

  static getFriendlyLength(size) {
    size = Number(size);
    if (size <= 0) {
      return '0';
    } else if (size < 1024) {
      return size + 'B';
    } else if (size < 1048576) {
      return Number((size / 1024).toFixed(1)) + 'K';
    } else if (size < 1073741824) {
      return Number((size / 1048576).toFixed(1)) + 'M';
    } else if (size < 1099511627776) {
      return Number((size / 1073741824).toFixed(1)) + 'G';
    } else if (size < 1125899906842624) {
      return Number((size / 1099511627776).toFixed(1)) + 'T';
    } else {
      return Number((size / 1125899906842624).toFixed(1)) + 'P';
    }
  }

  static formatDate(date = new Date(), fmt = 'yyyy-MM-dd') {
    const o = {
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'q+': Math.floor((date.getMonth() + 3) / 3),
      S: date.getMilliseconds()
    };

    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }

    for (const k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        const v = o[k];
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (v) : (('00' + v).substr(('' + v).length)));
      }
    }

    return fmt;
  }

  static formatDateTime(date = new Date(), fmt = 'yyyy-MM-dd hh:mm:ss') {
    const o = {
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'h+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds(),
      'q+': Math.floor((date.getMonth() + 3) / 3),
      S: date.getMilliseconds()
    };

    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }

    for (const k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        const v = o[k];
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (v) : (('00' + v).substr(('' + v).length)));
      }
    }

    return fmt;
  }

  static dealDataTime(date = new Date()) {
    date.setHours(date.getHours() + 8);
    return date;
  }

  static device = {
    bus: {
      name: '母线',
      label: 'bus',
      maxLinks: null
    },
    breaker: {
      name: '开关',
      label: 'breaker',
      maxLinks: 2,
      svg: 'F M0 5 L10 5 L10 25 L0 25 Z0 5 M5 0 L5 5 M5 25 L5 30'
    },
    groundDisconnector: {
      name: '接地刀闸',
      label: 'groundDisconnector',
      maxLinks: 1,
      svg: 'F M0 15 L10 15 M0 15 L5 30 L5 40 M-5 40 L15 40 M-1 45 L11 45 M2 50 L8 50'
    },
    acLineSegment: {
      name: '短引线',
      label: 'acLineSegment',
      maxLinks: 2,
      svg: 'F M0 40 L0 105'
      // 虚线 svg: 'F M0 40 L0 45 M0 50 L0 55 M0 60 L0 65 M0 70 L0 75 M0 80 L0 85 M0 90 L0 95 M0 100 L0 105'
      // 带箭头 svg: 'F M-6 31 L0 40 L6 31 Z M0 40 L0 45 M0 47 L0 52 M0 54 L0 59 M0 61 L0 66 M0 68 L0 73 M0 75 L0 80 M0 82 L0 87 M0 87 L-6 96 L6 96 Z'
    },
    disconnector: {
      name: '刀闸',
      label: 'disconnector',
      maxLinks: 2,
      svg: 'F M15 0 L0 0 L7.5 20 L7.5 24'
    },
    loadBreakSwitch: {
      name: '备用',
      label: 'loadBreakSwitch',
      maxLinks: 2,
      svg: 'F M0 0 L7.5 20 L7.5 24 M7.5,8.5c-3.8674,0 -7,-3.35635 -7,-7.5c0,-4.14365 3.1326,-7.5 7,-7.5c3.8674,0 7,3.35635 7,7.5c0,4.14365 -3.1326,7.5 -7,7.5z'
    },
    load: {
      name: '负荷',
      label: 'load',
      maxLinks: 1,
      svg: 'F M-15 0 L15 0 L15 20 L-15 20 Z M-12 2.5 L12 2.5 L12 17.5 L-12 17.5 Z M0 0 L0 -5 M0 10 L-5 10 L-5 17.5 M0 13 L-5 13'
    },
    tower: {
      name: '杆塔',
      label: 'tower',
      maxLinks: 999,
      svg: 'F M-3 0 C-3 -1.6568544000000003 -1.6568544000000003 -3 0 -3 C1.6568543999999994 -3 3 -1.6568544000000003 3 0' +
        ' C3 1.6568543999999994 1.6568543999999994 3 0 3 C-1.6568544000000003 3 -3 1.6568543999999994 -3 0'
    },
    tpoint: {
      name: '连接点',
      label: 'tpoint',
      maxLinks: 999,
      svg: 'F M-3 0 C-3 -1.6568544000000003 -1.6568544000000003 -3 0 -3 C1.6568543999999994 -3 3 -1.6568544000000003 3 0' +
        ' C3 1.6568543999999994 1.6568543999999994 3 0 3 C-1.6568544000000003 3 -3 1.6568543999999994 -3 0'
    },
    transformer: {
      name: '变压器',
      label: 'transformer',
      maxLinks: 1
    }
  };

  static unitSvg = {
    Breaker_Layer: 'M-0.15 -0.35h0.3v0.7h-0.3z M-0.470000 0.000000L-0.370000 0.000000 M0.370000 0.000000L0.470000 0.000000',
    SurgeArrester_Layer: '',
    PotentialTransformer_Layer: '',
    Substation_Layer: '',
    LoadBreakSwitch_Layer: '',
    GroundDisconnector_Layer: '',
    Disconnector_Layer: '',
    BusbarSection_Layer: '',
    Fuse_Layer: ''
  };

  static dzStatus = {
    // 未召回
    noRecall: 0,
    // 已召回
    recalling: 1,
    // 收到召回结果
    recalled: 2,
    // 已经下装
    modifying: 3,
    // 收到下装结果
    modified: 4
  };

  static diagramMap = new Map();

  static getDiagram(key) {
    return Globals.diagramMap.get(key);
  }

  static destroyDiagram(key) {
    const d = Globals.diagramMap.get(key);
    if (d) {
      d.div = null;
    }
    Globals.diagramMap.delete(key);
  }

  static appendDiagram(key, d) {
    Globals.destroyDiagram(key);
    Globals.diagramMap.set(key, d);
  }

  static formatXmlNode(data) {
    return {
      id: data.$['rdf:ID'],
      name: data?.['cim:IdentifiedObject.name']?.[0] || '',
      tag: data.tag,
      container: data?.['cim:Equipment.EquipmentContainer']?.[0]?.$['rdf:resource'] || ''
    };
  }

  static getParentPaths({ structure, id, path = [[]] }) {
    const paths = new Map();
    const allPath = [];
    // 查找包含id开关的关系
    const filter = structure.filter(x => this.formatXmlNode(x.to).id === id);
    for (const item of filter) {
      const from = this.formatXmlNode(item.from);
      const pathCopy = JSON.parse(JSON.stringify(path));
      for (const p of pathCopy) {
        p.push(item.from);
      }
      paths.set(from.id, pathCopy);
    }
    if (paths.size === 0) {
      return path;
    }
    for (const key of paths.keys()) {
      allPath.push(...this.getParentPaths({ id: key, path: paths.get(key), structure }));
    }
    return allPath;
  }
}

export default Globals;
