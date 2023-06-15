
window.onload = function () {
  drawMap("#container");
};

//지도 그리기
function drawMap(target) {

  var tooltip = null;
  var activeMarker = null; 

  var width = 1400; //지도의 넓이
  var height = 900; //지도의 높이
  var initialScale = 5900; //확대시킬 값

 
  var initialX = -12300; //초기 위치값 X
  var initialY = 4400; //초기 위치값 Y

  var projection = d3.geo
    .mercator()
    .scale(initialScale)
    .translate([initialX, initialY]);

// projection 객체 업데이트
projection.translate([initialX, initialY]);

  var path = d3.geo.path().projection(projection);
    var zoom = d3.behavior
      .zoom()
      .translate(projection.translate())
      .scale(projection.scale())
      .scaleExtent([height, 800 * height])
      .on("zoom", zoom);

  var svg = d3
    .select(target)
    .append("svg")
    .attr("width", width + "px")
    .attr("height", height + "px")
    .attr("id", "map")
    .attr("class", "map");
 // var states = svg.append("g").attr("id", "states");
    var states = svg.append("g").attr("id", "states").call(zoom);

  states
    .append("rect")
    .attr("class", "background")
    .attr("width", width + "px")
    .attr("height", height + "px");

  //geoJson데이터를 파싱하여 지도그리기
  d3.json("json/korea.json", function (json) {
    states
      .selectAll("path") //지역 설정
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("id", function (d) {
        return "path-" + d.properties.name;
      });
  });

  $.ajax({
    url: "https://apis.data.go.kr/1383000/gmis/teenRAreaServiceV2/getTeenRAreaListV2",
    dataType: "json",
    type: "GET",
    data: {
      serviceKey:
        "AEeuwvajD3QRFbK0/nUnMu+ZEriR57JYGY4KvAV2kOSr7Ucv455cBA69UBQnFtCjKvDEy3WRynFW6nFhero3Tg==",
      pageNo: 1,
      numOfRows: 134,
      type: "json",
    },
    success: function (data) {
      //console.log("data", data.response.body.items.item);
      var imageSize = 20;

      //ctvpNm별 개수세기
      var countByCtpvNm = {}; // ctvpNm별 개수를 저장할 객체

      data.response.body.items.item.forEach(function(d) {
        var ctvpNm = d.ctpvNm;
        if (countByCtpvNm[ctvpNm]) {
          countByCtpvNm[ctvpNm]++; // 이미 있는 ctvpNm이면 개수 증가
        } else {
          countByCtpvNm[ctvpNm] = 1; // 새로운 ctvpNm이면 개수 초기화
        }
      });

     // Determine the range of values for the count of ctpvNm
      var counts = Object.values(countByCtpvNm);


// Define a color scale with different colors representing the steps
var colorScale = d3.scale.linear()
  .domain([0, 5, 10, 15, 20, 30])
  .range(["#e3f0fc", "#b6dbfc", "#81c2fc", "#5caff7", "#0c89f5", "#025cab"]);


  states.selectAll("path")
  .style("fill", function(d) {
    var ctvpNm = d.properties.name; 
    var count = countByCtpvNm[ctvpNm]; 
   
    if (ctvpNm === "세종") {
      return "#e3f0fc";
    }

    if (count < 1) {
      return colorScale(0); 
    } else if (count < 6) {
      return colorScale(5); 
    } else if (count < 8) {
      return colorScale(10); 
    } else if (count < 10) {
      return colorScale(15); 
    } else if (count < 17) {
      return colorScale(20); 
    } else {
      return colorScale(30); 
    }
   
  });

    console.log(countByCtpvNm);       
    
      //marker 추가
      var markers = svg
        .selectAll("image")
        .data(data.response.body.items.item)
        .enter()
        .append("image")
        .attr("x", function (d) {
          return projection([d.lot, d.lat])[0] - imageSize / 2;
        })
        .attr("y", function (d) {
          return projection([d.lot, d.lat])[1] - imageSize / 2;
        })
        .attr("width", imageSize)
        .attr("height", imageSize)
        .attr("xlink:href", "img/re_marker.png");

        markers.on("click", function (d) {
          if (d3.select(this).classed("active")) {
            if (tooltip) {
              tooltip.remove();
              tooltip = null;  
            }
        
            if (activeMarker) {
              activeMarker.classed("active", false);
              activeMarker = null; 
            }
          } else {
            if (tooltip) {
              tooltip.remove();
            }
        
            if (activeMarker) {
              activeMarker.classed("active", false);
            }
        
            var marker = d3.select(this);
            marker.classed("active", true);
            activeMarker = marker;
        
            var markerPosition = marker.node().getBoundingClientRect();
            var markerX = markerPosition.x + markerPosition.width / 2;
            var markerY = markerPosition.y + markerPosition.height / 2;
        
            tooltip = d3
              .select("body")
              .append("div")
              .attr("class", "tooltip")
              .text("쉼터명: " + d.fcltNm)
              .style("left", markerX +20 + "px")
              .style("top", markerY -25 + "px");
        
            tooltip.on("click", function() {
              d3.select(this).remove();
              d3.select(".active").classed("active", false);
              tooltip = null; // Reset the tooltip variable
              activeMarker = null; // Reset the activeMarker variable
            });
          }
          });

     
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log("Error:", textStatus, errorThrown);
    },
  });

    function zoom() {
      var imageSize = 20;
      projection.translate(d3.event.translate).scale(d3.event.scale);
      states.selectAll("path").attr("d", path);

      svg
        .selectAll("image")
        .attr("x", function(d) {
          return projection([d.lot, d.lat])[0] - imageSize / 2;
        })
        .attr("y", function(d) {
          return projection([d.lot, d.lat])[1] - imageSize / 2;
        });

        if (tooltip && activeMarker) {
          var markerX = parseFloat(activeMarker.attr("x"));
          var markerY = parseFloat(activeMarker.attr("y"));
          tooltip
            .style("left", (markerX + imageSize + 55 ) + "px")
            .style("top", (markerY + imageSize -12 ) + "px");
        }
    }
}


