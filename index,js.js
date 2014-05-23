/**
 * Created by cuebyte on 2014/5/23.
 */

var request = require("request");
var q = require("q");
var fs = require("fs");

var lists = [
  {id: 180106, name: "UK", day: 1},
  {id: 60198, name: "Billboard", day: 1},
  {id: 60131, name: "Oricon", day: 4}
];
var path = "./";

function summyList(input) {
  var list = JSON.parse(input);
  var output = {};
  if(list.code != 200) {
    // 日志输出
    return new Error(err);
  }
  output.name = list.result.name;
  var length = list.result.tracks.length;
  output.tracks = [];
  for(var i=0; i < length; i++) {
    output.tracks[i] = {};
    output.tracks[i].name = list.result.tracks[i].name;
    var length2 = list.result.tracks[i].artists.length;
    output.tracks[i].artists = [];
    for(var j=0; j < length2; j++) {
      output.tracks[i].artists[j] = {};
      output.tracks[i].artists[j].name = list.result.tracks[i].artists[j].name;
    }
  }
  return output;
}

// xml format
function packSimpleList2Kgl(list) {
  var date = new Date();
  var title = list.name + " " + date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();

  // write xml header
  var content = '<?xml version="1.0" encoding="windows-1252"?>\n' +
    '<List ListName="' + title + '">\n';

  // write music info
  for(var i=0, l=list.tracks.length; i < l; i++) {
    content += '<File><FileName>' + list.tracks[i].artists[0].name + ' - ' + list.tracks[i].name + '.mp3</FileName></File>\n';
  }
  content += '</List>';

  // 存储为.kgl文件
  fs.writeFile(path+title+".kgl", content, function(err) {
    if(err) throw err;
  });
}

function req(id) {
  var deferred = q.defer();
  var query = "http://music.163.com/api/playlist/detail?id=" + id + "&offset=0&total=true&limit=200";
  request(query, function(error, res, body) {
    if (error || res.statusCode!=200) {
      deferred.reject(err);
    } else {
      deferred.resolve(body);
    }
  });
  return deferred.promise;
}

function runTask() {
  var date = new Date();
  var today = date.getDay();
  var taskList = [];
  for(var i=0; i < lists.length; i++) {
    if(lists[i].day == 1) {
      taskList[i] = lists[i].id;
    }
  }
  if(taskList.length==0) return;
  q.all(taskList.map(function(id) {
    req(id)
      .then(summyList)
      .then(packSimpleList2Kgl)
      .fail(function(err) {
        console.log(err);
      });
  }));
};

(function() {
  runTask()
})();