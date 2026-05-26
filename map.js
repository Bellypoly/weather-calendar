(function() {
  var mapSettings = {
    width: 800,
    height: 640,
    dataUrl: "thailand.json",
    temperatureUrl: "temperature.json",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    defaultMonth: "May",
    noDataFill: "#ddd",
    hoverFill: "#fff3a2",
    selectedFill: "#006d77",
    zoomScale: 2.8,
    zoomDuration: 750,
    fitPadding: 26,
    temperatureStops: [68, 72, 76, 80, 84, 88],
    temperatureColors: [
      "#3b8f98",
      "#8fc8a3",
      "#e4df72",
      "#ffc15e",
      "#ff8c3a",
      "#f35b3f",
      "#d7191c"
    ],
    projection: {
      rotate: [-100.6331, -13.2]
    }
  };

  var HUMAN_SURVIVAL_INDEX = [
    {
      min: -Infinity,
      max: 68,
      emoji: "\uD83E\uDDCA",
      label: "Chill Mode",
      meme: "AC Weather",
      description: "The rare Thailand day where you can walk outside without immediately regretting life.",
      className: "heat-mood--cool"
    },
    {
      min: 68,
      max: 72,
      emoji: "\uD83D\uDE42",
      label: "Walkable",
      meme: "Grass Touching Weather",
      description: "Humans may safely interact with the outdoors for a limited time.",
      className: "heat-mood--nice"
    },
    {
      min: 72,
      max: 76,
      emoji: "\uD83E\uDD75",
      label: "Sweaty",
      meme: "Shirt Destroyer",
      description: "Your shirt officially loses the battle against humidity.",
      className: "heat-mood--warm"
    },
    {
      min: 76,
      max: 80,
      emoji: "\uD83D\uDD25",
      label: "Thai Summer",
      meme: "Motorcycle Seat Pain",
      description: "Parking under the sun now counts as a dangerous activity.",
      className: "heat-mood--hot"
    },
    {
      min: 80,
      max: 84,
      emoji: "\u2620\uFE0F",
      label: "Survival Mode",
      meme: "7-Eleven Spawn Point",
      description: "Your daily route becomes: sun -> 7-Eleven -> survive -> repeat.",
      className: "heat-mood--extreme"
    },
    {
      min: 84,
      max: 88,
      emoji: "\uD83C\uDF0B",
      label: "Asphalt Simulator",
      meme: "Flip-Flop Melting Season",
      description: "Sidewalks begin feeling legally classified as cooking surfaces.",
      className: "heat-mood--extreme"
    },
    {
      min: 88,
      max: Infinity,
      emoji: "\uD83D\uDC80",
      label: "Human Air Fryer",
      meme: "Outside Is Lava",
      description: "At this point, Thailand is no longer weather - it is a boss fight.",
      className: "heat-mood--extreme"
    }
  ];

  var EMPTY_STATE_COPY = {
    detailTitle: "Somewhere in Thailand",
    detailValue: "--.-°",
    detailCaption: "Awaiting human suffering data",
    heatEmoji: "\uD83C\uDF21\uFE0F",
    heatClass: "heat-mood--idle",
    heatTitle: "Select Your Difficulty",
    heatRange: "Thailand heat simulator ready.",
    heatMeme: "Click a province to discover",
    heatNote: "how cooked humans become."
  };

  var HEAT_MOOD_CLASSES = [
    "heat-mood--idle",
    "heat-mood--cool",
    "heat-mood--nice",
    "heat-mood--warm",
    "heat-mood--hot",
    "heat-mood--extreme"
  ];

  function ThailandMap(settings) {
    this.settings = settings;
    this.mode = "year";
    this.unit = "F";
    this.currentMonth = settings.defaultMonth;
    this.selectedProvince = null;
    this.temperatureByCity = {};

    this.temperatureColor = d3.scale.threshold()
      .domain(settings.temperatureStops)
      .range(settings.temperatureColors);

    this.monthlyCircles = d3.select(".monthly-circles");
    this.monthTabs = d3.select(".month-tabs");
    this.legendTitle = d3.select(".legend__title");
    this.legendItems = d3.select(".legend__items");
    this.unitToggle = d3.select(".unit-toggle");
    this.modeButtons = d3.selectAll(".mode-toggle__button");
    this.circleTitle = d3.select(".monthly-circles__title");
    this.detailCity = d3.select(".detail-card__city");
    this.detailValue = d3.select(".detail-card__value");
    this.detailCaption = d3.select(".detail-card__caption");
    this.heatMood = d3.select(".heat-mood");
    this.heatMoodEmoji = d3.select(".heat-mood__emoji");
    this.heatMoodLabel = d3.select(".heat-mood__label");
    this.heatMoodRange = d3.select(".heat-mood__range");
    this.heatMoodMeme = d3.select(".heat-mood__meme");
    this.heatNote = d3.select(".heat-note");

    this.svg = d3.select("#map").append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", "0 0 " + settings.width + " " + settings.height)
      .attr("preserveAspectRatio", "xMidYMid meet");

    this.stage = this.svg.append("g");

    this.provinceLayer = this.stage.append("g")
      .attr("class", "province-layer");

    this.mapLabel = this.stage.append("g")
      .attr("class", "province-map-label")
      .style("display", "none");

    this.mapLabelText = this.mapLabel.append("text")
      .attr("dy", "0.35em");

    this.projection = d3.geo.mercator()
      .rotate(settings.projection.rotate);

    this.path = d3.geo.path().projection(this.projection);
  }

  ThailandMap.prototype.start = function() {
    this.drawBackground();
    this.drawMonthTabs();
    this.drawLegend();
    this.bindModeButtons();
    this.bindUnitToggle();
    this.loadData();
  };

  ThailandMap.prototype.drawBackground = function() {
    this.svg.insert("rect", ":first-child")
      .attr("class", "map-background")
      .attr("width", "100%")
      .attr("height", "100%")
      .on("click", this.resetZoom.bind(this));
  };

  ThailandMap.prototype.drawMonthTabs = function() {
    var map = this;

    this.monthTabs.selectAll("button")
      .data(this.settings.months)
      .enter()
      .append("button")
      .attr("type", "button")
      .classed("is-active", function(month) {
        return map.mode === "month" && month === map.currentMonth;
      })
      .text(function(month) {
        return month;
      })
      .on("click", function(month) {
        map.setMonth(month);
      });
  };

  ThailandMap.prototype.drawLegend = function() {
    var map = this;
    var stops = this.settings.temperatureStops;
    var labels = [
      [null, stops[0]],
      [stops[0], stops[1]],
      [stops[1], stops[2]],
      [stops[2], stops[3]],
      [stops[3], stops[4]],
      [stops[4], stops[5]],
      [stops[5], null]
    ];

    this.legendItems.selectAll(".legend__item")
      .data(this.settings.temperatureColors.map(function(color, index) {
        return {
          color: color,
          label: labels[index]
        };
      }))
      .enter()
      .append("div")
      .attr("class", "legend__item")
      .html(function(d) {
        return (
          '<span class="legend__swatch" style="background:' + d.color + '"></span>' +
          '<span class="legend__label">' + map.getLegendLabel(d.label) + '</span>'
        );
      });

    this.updateLegend();
  };

  ThailandMap.prototype.bindModeButtons = function() {
    var map = this;

    this.modeButtons.on("click", function() {
      map.setMode(this.getAttribute("data-mode"));
    });
  };

  ThailandMap.prototype.bindUnitToggle = function() {
    var map = this;

    this.unitToggle.on("click", function() {
      map.toggleUnit();
    });
  };

  ThailandMap.prototype.loadData = function() {
    var map = this;

    d3.json(this.settings.dataUrl, function(error, provinceData) {
      if (error) {
        map.showError("Could not load " + map.settings.dataUrl);
        throw error;
      }

      d3.json(map.settings.temperatureUrl, function(temperatureError, temperatureData) {
        if (temperatureError) {
          map.showError("Could not load " + map.settings.temperatureUrl);
          throw temperatureError;
        }

        map.setTemperatureData(temperatureData);
        map.fitProjection(provinceData);
        map.drawProvinces(provinceData.features);
        map.showEmptyState();
        map.updateControls();
      });
    });
  };

  ThailandMap.prototype.setTemperatureData = function(temperatureData) {
    var map = this;

    temperatureData.forEach(function(row) {
      map.temperatureByCity[row.city] = row;
    });
  };

  ThailandMap.prototype.fitProjection = function(provinceData) {
    var padding = this.settings.fitPadding;
    var width = this.settings.width;
    var height = this.settings.height;

    this.projection
      .scale(1)
      .translate([0, 0]);

    var bounds = this.path.bounds(provinceData);
    var mapWidth = bounds[1][0] - bounds[0][0];
    var mapHeight = bounds[1][1] - bounds[0][1];
    var scale = Math.min((width - padding * 2) / mapWidth, (height - padding * 2) / mapHeight);
    var translate = [
      (width - mapWidth * scale) / 2 - bounds[0][0] * scale,
      (height - mapHeight * scale) / 2 - bounds[0][1] * scale
    ];

    this.projection
      .scale(scale)
      .translate(translate);
  };

  ThailandMap.prototype.drawProvinces = function(provinces) {
    var map = this;

    this.provinceLayer.selectAll("path")
      .data(provinces)
      .enter()
      .append("path")
      .attr("class", "province")
      .attr("data-province", function(province) {
        return map.getProvinceName(province);
      })
      .attr("d", this.path)
      .style("fill", function(province) {
        return map.getProvinceFill(province);
      })
      .each(function(province) {
        this.addEventListener("mouseover", function() {
          map.showHoverProvince(province, this);
        });

        this.addEventListener("mouseout", function() {
          map.restoreProvinceState();
        });

        this.addEventListener("click", function() {
          map.selectProvince(province, true);
        });
      });
  };

  ThailandMap.prototype.showEmptyState = function() {
    this.selectedProvince = null;
    this.hideMapLabel();
    this.clearTemperatureCircles();

    this.detailCity.text(EMPTY_STATE_COPY.detailTitle);
    this.detailValue.text(EMPTY_STATE_COPY.detailValue + this.unit);
    this.detailCaption.text(EMPTY_STATE_COPY.detailCaption);
    this.updateCircleTitle();

    this.updateHeatMood(null);
  };

  ThailandMap.prototype.setMonth = function(month) {
    this.currentMonth = month;
    this.mode = "month";
    this.updateControls();
    this.paintProvinces();

    if (this.selectedProvince) {
      this.showDetailPanel(this.selectedProvince);
      this.renderTemperatureCircles(this.selectedProvince);
      this.showMapLabel(this.selectedProvince);
    } else {
      this.showEmptyState();
    }
  };

  ThailandMap.prototype.setMode = function(mode) {
    this.mode = mode;
    this.updateControls();
    this.paintProvinces();

    if (this.selectedProvince) {
      this.showDetailPanel(this.selectedProvince);
      this.renderTemperatureCircles(this.selectedProvince);
      this.showMapLabel(this.selectedProvince);
    } else {
      this.showEmptyState();
    }
  };

  ThailandMap.prototype.updateControls = function() {
    var map = this;

    this.modeButtons.classed("is-active", function() {
      return this.getAttribute("data-mode") === map.mode;
    });

    this.monthTabs.selectAll("button")
      .classed("is-active", function(month) {
        return map.mode === "month" && month === map.currentMonth;
      });
  };

  ThailandMap.prototype.showHoverProvince = function(province, element) {
    if (element && this.selectedProvince !== province) {
      element.style.fill = this.settings.hoverFill;
    }

    this.showMapLabel(province);
  };

  ThailandMap.prototype.restoreProvinceState = function() {
    this.paintProvinces();

    if (this.selectedProvince) {
      this.showMapLabel(this.selectedProvince);
      return;
    }

    this.hideMapLabel();
  };

  ThailandMap.prototype.selectProvince = function(province, shouldZoom) {
    this.selectedProvince = province;
    this.showDetailPanel(province);
    this.renderTemperatureCircles(province);
    this.showMapLabel(province);
    this.paintProvinces();

    if (shouldZoom) {
      this.zoomTo(province);
    }
  };

  ThailandMap.prototype.resetZoom = function() {
    this.stage.transition()
      .duration(this.settings.zoomDuration)
      .attr("transform", "");
  };

  ThailandMap.prototype.zoomTo = function(province) {
    var centroid = this.path.centroid(province);
    this.moveTo(centroid[0], centroid[1], this.settings.zoomScale);
  };

  ThailandMap.prototype.moveTo = function(x, y, scale) {
    var width = this.settings.width;
    var height = this.settings.height;
    var transform = [
      "translate(" + width / 2 + "," + height / 2 + ")",
      "scale(" + scale + ")",
      "translate(" + -x + "," + -y + ")"
    ].join("");

    this.stage.transition()
      .duration(this.settings.zoomDuration)
      .attr("transform", transform);
  };

  ThailandMap.prototype.paintProvinces = function() {
    var map = this;

    this.provinceLayer.selectAll(".province")
      .style("fill", function(province) {
        return map.selectedProvince === province
          ? map.settings.selectedFill
          : map.getProvinceFill(province);
      });
  };

  ThailandMap.prototype.getProvinceFill = function(province) {
    var temperature = this.getProvinceTemperature(province);

    if (!temperature) {
      return this.settings.noDataFill;
    }

    return this.temperatureColor(this.getActiveTemperatureValue(temperature));
  };

  ThailandMap.prototype.getActiveTemperatureValue = function(temperature) {
    if (this.mode === "year") {
      return temperature.avg;
    }

    return temperature.temperatures[this.currentMonth];
  };

  ThailandMap.prototype.getProvinceTemperature = function(province) {
    return this.temperatureByCity[this.getProvinceName(province)];
  };

  ThailandMap.prototype.getProvinceHoverText = function(province) {
    return (
      this.getProvinceName(province) +
      " / " +
      this.getTemperatureText(this.getProvinceTemperature(province))
    );
  };

  ThailandMap.prototype.showMapLabel = function(province) {
    var centroid = this.path.centroid(province);
    var text = this.getProvinceHoverText(province);
    var gap = 14;

    this.mapLabel
      .style("display", null)
      .attr(
        "transform",
        "translate(" + (centroid[0] + gap) + "," + centroid[1] + ")"
      );

    this.mapLabelText
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "start")
      .text(text);
  };

  ThailandMap.prototype.hideMapLabel = function() {
    this.mapLabel.style("display", "none");
  };

  ThailandMap.prototype.showDetailPanel = function(province) {
    var name = this.getProvinceName(province);
    var temperature = this.getProvinceTemperature(province);

    this.detailCity.text(name);
    this.detailValue.text(this.getTemperatureText(temperature));
    this.detailCaption.text(this.getModeLabel() + " temperature");

    this.updateHeatMood(temperature);
  };

  ThailandMap.prototype.getHeatMood = function(value) {
    return HUMAN_SURVIVAL_INDEX.filter(function(mood) {
      return value >= mood.min && value < mood.max;
    })[0];
  };

  ThailandMap.prototype.formatSurvivalRange = function(mood) {
    if (mood.min === -Infinity) {
      return "< " + this.formatTemperature(mood.max);
    }

    if (mood.max === Infinity) {
      return "> " + this.formatTemperature(mood.min);
    }

    return this.formatTemperature(mood.min) + " - " + this.formatTemperature(mood.max);
  };

  ThailandMap.prototype.updateHeatMood = function(temperature) {
    var mood;
    var activeValue;
  
    HEAT_MOOD_CLASSES.forEach(function(className) {
      this.heatMood.classed(className, false);
    }, this);
  
    if (!temperature) {
      this.heatMood.classed(EMPTY_STATE_COPY.heatClass, true);
      this.heatMoodEmoji.text(EMPTY_STATE_COPY.heatEmoji);
      this.heatMoodLabel.text(EMPTY_STATE_COPY.heatTitle);
      this.heatMoodRange.text(EMPTY_STATE_COPY.heatRange);
      this.heatMoodMeme.text(EMPTY_STATE_COPY.heatMeme);
      this.heatNote.text(EMPTY_STATE_COPY.heatNote);
      return;
    }
  
    activeValue = this.getActiveTemperatureValue(temperature);
    mood = this.getHeatMood(activeValue);
  
    this.heatMood.classed(mood.className, true);
    this.heatMoodEmoji.text(mood.emoji);
    this.heatMoodLabel.text(mood.label);
    this.heatMoodRange.text(this.formatSurvivalRange(mood));
    this.heatMoodMeme.text(mood.meme);
  
    this.heatNote.text(mood.description);
  };

  ThailandMap.prototype.renderTemperatureCircles = function(province) {
    var temperature = this.getProvinceTemperature(province);
    var map = this;
    var circleValues;
    var dots;

    if (!temperature) {
      this.clearTemperatureCircles();
      return;
    }

    circleValues = this.getTemperatureCircleData(temperature);

    circleValues.forEach(function(d) {
      d.isLowest = d.value === d.lowestValue;
      d.isHighest = d.value === d.highestValue;
    });

    this.monthlyCircles.classed("is-year", this.mode === "year");
    this.updateCircleTitle();

    dots = this.monthlyCircles.selectAll(".monthly-circles__item")
      .data(circleValues, function(d) {
        return d.key;
      });

    dots.enter()
      .append("span")
      .attr("class", "monthly-circles__item")
      .html(
        '<span class="monthly-circles__dot">' +
          '<span class="monthly-circles__value">' +
            '<span class="monthly-circles__normal"></span>' +
            '<span class="monthly-circles__split">' +
              '<span class="monthly-circles__low"></span>' +
              '<span class="monthly-circles__high"></span>' +
            '</span>' +
          '</span>' +
        '</span>' +
        '<span class="monthly-circles__month"></span>'
      );

    dots.classed("is-active", function(d) {
      return map.mode === "year" || d.month === map.currentMonth;
    })
      .classed("is-lowest", function(d) {
        return d.isLowest;
      })
      .classed("is-highest", function(d) {
        return d.isHighest;
      });

    dots.select(".monthly-circles__dot")
      .style("--month-color", function(d) {
        return map.temperatureColor(d.value);
      })
      .style("--low-color", function(d) {
        return map.temperatureColor(d.lowestValue);
      })
      .style("--high-color", function(d) {
        return map.temperatureColor(d.highestValue);
      })
      .attr("title", function(d) {
        return "low = " + map.formatTemperature(d.lowestValue) +
          "\nhigh = " + map.formatTemperature(d.highestValue);
      });

    dots.select(".monthly-circles__normal")
      .text(function(d) {
        return map.formatCircleTemperature(d.value);
      });

    dots.select(".monthly-circles__low")
      .text(function(d) {
        return map.formatCircleTemperature(d.lowestValue);
      });

    dots.select(".monthly-circles__high")
      .text(function(d) {
        return map.formatCircleTemperature(d.highestValue);
      });

    dots.select(".monthly-circles__month")
      .text(function(d) {
        return d.label;
      });

    dots.exit().remove();
  };

  ThailandMap.prototype.clearTemperatureCircles = function() {
    this.monthlyCircles
      .classed("is-year", false)
      .selectAll(".monthly-circles__item")
      .remove();
    this.updateCircleTitle();
  };

  ThailandMap.prototype.updateCircleTitle = function() {
    this.circleTitle
      .classed("is-visible", this.mode === "month" && !!this.selectedProvince)
      .text("monthly average temperature (\u00B0" + this.unit + ")");
  };

  ThailandMap.prototype.getTemperatureCircleData = function(temperature) {
    if (this.mode === "year") {
      return [this.getAnnualCircleData(temperature)];
    }

    return this.getMonthlyCircleData(temperature);
  };

  ThailandMap.prototype.getAnnualCircleData = function(temperature) {
    var annualRange = this.getAnnualTemperatureRange(temperature);

    return {
      key: "year",
      label: "2025",
      value: temperature.avg,
      lowestValue: annualRange.lowest,
      highestValue: annualRange.highest
    };
  };

  ThailandMap.prototype.getMonthlyCircleData = function(temperature) {
    var map = this;

    return this.settings.months.map(function(month) {
      var monthRange = map.getTemperatureRange(temperature, month);

      return {
        key: month,
        month: month,
        label: month,
        value: map.getMonthlyAverage(monthRange),
        lowestValue: monthRange.lowest,
        highestValue: monthRange.highest
      };
    });
  };

  ThailandMap.prototype.getTemperatureRange = function(temperature, month) {
    return {
      lowest: temperature.low && temperature.low[month] !== undefined
        ? temperature.low[month]
        : temperature.temperatures[month],
      highest: temperature.high && temperature.high[month] !== undefined
        ? temperature.high[month]
        : temperature.temperatures[month]
    };
  };

  ThailandMap.prototype.getAnnualTemperatureRange = function(temperature) {
    var map = this;
    var ranges = this.settings.months.map(function(month) {
      return map.getTemperatureRange(temperature, month);
    });

    return {
      lowest: d3.min(ranges, function(range) {
        return range.lowest;
      }),
      highest: d3.max(ranges, function(range) {
        return range.highest;
      })
    };
  };

  ThailandMap.prototype.getMonthlyAverage = function(range) {
    return (range.lowest + range.highest) / 2;
  };

  ThailandMap.prototype.formatCircleTemperature = function(value) {
    return this.convertTemperature(value).toFixed(0);
  };

  ThailandMap.prototype.showError = function(message) {
    this.detailCity.text(message);
    this.detailValue.text("--.-°" + this.unit);
    this.detailCaption.text("");
  };

  ThailandMap.prototype.getModeLabel = function() {
    return this.mode === "year" ? "Annual Avg" : this.currentMonth + " Avg.";
  };

  ThailandMap.prototype.getTemperatureText = function(temperature) {
    if (!temperature) {
      return "--.-°" + this.unit;
    }

    return this.formatTemperature(this.getActiveTemperatureValue(temperature));
  };

  ThailandMap.prototype.updateLegend = function() {
    var map = this;

    this.legendTitle.text("Temperature (°" + this.unit + ")");
    this.unitToggle.text("°" + this.unit);

    this.legendItems.selectAll(".legend__item")
      .select(".legend__label")
      .text(function(d) {
        return map.getLegendLabel(d.label);
      });
  };

  ThailandMap.prototype.toggleUnit = function() {
    this.unit = this.unit === "F" ? "C" : "F";
    this.updateLegend();

    if (this.selectedProvince) {
      this.showMapLabel(this.selectedProvince);
      this.showDetailPanel(this.selectedProvince);
      this.renderTemperatureCircles(this.selectedProvince);
    } else {
      this.showEmptyState();
    }
  };

  ThailandMap.prototype.formatTemperature = function(value) {
    return this.convertTemperature(value).toFixed(1) + "°" + this.unit;
  };

  ThailandMap.prototype.convertTemperature = function(value) {
    if (this.unit === "C") {
      return (value - 32) * 5 / 9;
    }

    return value;
  };

  ThailandMap.prototype.getLegendLabel = function(range) {
    if (range[0] === null) {
      return "< " + this.formatThreshold(range[1]);
    }

    if (range[1] === null) {
      return "> " + this.formatThreshold(range[0]);
    }

    return this.formatThreshold(range[0]) + " - " + this.formatThreshold(range[1]);
  };

  ThailandMap.prototype.formatThreshold = function(value) {
    return this.unit === "C"
      ? this.convertTemperature(value).toFixed(0)
      : value.toFixed(0);
  };

  ThailandMap.prototype.getProvinceName = function(province) {
    if (!province || !province.properties) {
      return "";
    }

    return province.properties.name || "";
  };

  new ThailandMap(mapSettings).start();
})();
