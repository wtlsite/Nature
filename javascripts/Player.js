(function () {
    function Player() {
        this.playlist = [];
        this.searchResult = [];
        this.audio = document.getElementsByTagName('audio')[0];
        this.currentPlay = 0;
        this.repeatMode = 'list';
        this.playlistState = 'show';
        this.lyric = {};
        this.offset = 0;
        this.initDom();
        this.initEvent();
    }

    Player.prototype.initDom = function () {
        //播放列表
        this.playlistContainer = document.querySelector('.playlist');
        this.listSwitch = document.querySelector('.listSwitch');

        //播放控制
        this.playNextBtn = document.querySelector('.next');
        this.playPreBtn = document.querySelector('.pre');
        this.playPauseBtn = document.querySelector('.play');
        this.progress = document.querySelector('.progress');
        this.proInner = document.querySelector('.pro-inner');
        this.leftTime = document.querySelector('.time');
        this.repeatBtn = document.querySelector('.loop');

        this.lyricBox = document.querySelector('.lrc');

        //搜索
        this.searchResultBox = document.querySelector('.searchResult');
        this.searchBtn = document.querySelector('.searchBtn');
        this.searchKey = document.querySelector('.searchKey');
    };
    Player.prototype.initEvent = function () {
        var _this = this;

        document.addEventListener('keydown', function (e) {
            switch (e.keyCode) {
                case 37 : // 快退
                    _this.audio.currentTime -= (_this.audio.duration * 0.01);
                    break;
                case 38 : //音量+
                    if (_this.audio.volume < 1) _this.audio.volume += 0.25;
                    layer.msg('音量：' + parseInt(_this.audio.volume * 100) + '%');
                    break;
                case 39 : //快进
                    _this.audio.currentTime += (_this.audio.duration * 0.01);
                    break;
                case 40 : //音量-
                    if (_this.audio.volume > 0) _this.audio.volume -= 0.25;
                    layer.msg('音量：' + parseInt(_this.audio.volume * 100) + '%');
                    break;
            }
        });

        this.audio.addEventListener('timeupdate', function () {
            _this.showLrc(_this.audio.currentTime);
            _this.updateProgress();
        });

        this.audio.addEventListener('error', function () {
            layer.msg('该音乐无法播放，请前往网易云音乐尝试');
        });

        this.audio.addEventListener('ended', function () {
            if (_this.repeatMode === 'list') {
                _this.playNext();
            } else {
                _this.play(_this.playlist[_this.currentPlay])
            }
        });

        //上一曲、下一曲
        this.playNextBtn.addEventListener('click', function () {
            layer.msg('下一曲');
            _this.playNext();
        });
        this.playPreBtn.addEventListener('click', function () {
            layer.msg('上一曲');
            _this.playPre();
        });

        this.progress.addEventListener('click', function (e) {
            var percent = e.offsetX / _this.progress.offsetWidth;
            _this.audio.currentTime = _this.audio.duration * percent;
            _this.proInner.style.width = percent * 100 + "%";
        });

        this.repeatBtn.addEventListener('click', function (e) {
            if (_this.repeatMode === 'list') {
                _this.repeatMode = 'one';
                e.target.innerHTML = '&#xea47';
            } else {
                _this.repeatMode = 'list';
                e.target.innerHTML = '&#xeb28';
            }
        });
        //播放列表
        this.playPauseBtn.addEventListener('click', function () {
            _this.playPause();
        });

        this.listSwitch.addEventListener('click', function () {
            if (_this.playlistState === 'show') {
                _this.playlistContainer.style.right = '-249px';
                _this.searchResultBox.style.marginRight = '0';
                _this.playlistState = 'hidden'
            } else {
                _this.playlistContainer.style.right = '0';
                _this.searchResultBox.style.marginRight = '251px';
                _this.playlistState = 'show'
            }
        });

        this.playlistContainer.addEventListener('click', function (e) {
            var len = _this.playlistContainer.children.length;
            for (var i = 0; i < len; i++) {
                //点击播放列表项目名称播放该歌曲
                if (e.target === _this.playlistContainer.children[i].children[0]) {
                    _this.setCurrentPlay(i);
                    _this.play(_this.playlist[i]);
                    _this.currentPlay = i;
                }
                //点击删除按钮从播放列表中删除项目
                if (e.target === _this.playlistContainer.children[i].children[2]) {
                    _this.playlist.splice(i, 1);
                    _this.currentPlay -= 1;
                    _this.updatePlaylist();
                }
            }
        });

        //搜索
        this.searchResultBox.addEventListener('click', function (e) {
            var len = _this.searchResultBox.children.length;
            for (var i = 0; i < len; i++) {
                //点击当前音乐播放按钮
                if (e.target === _this.searchResultBox.children[i].children[0].children[0]) {
                    _this.play(_this.searchResult[i]);
                    _this.playlist.push(_this.searchResult[i]);
                    _this.currentPlay = _this.playlist.length - 1;
                    _this.updatePlaylist();
                    _this.setCurrentPlay(_this.currentPlay);
                }
                if (e.target === _this.searchResultBox.children[i].children[3]) {
                    //如果点击搜索结果的歌手名则搜索该歌手的歌曲;
                    _this.searchKey.value = e.target.innerHTML;
                    _this.searchResult = [];
                    _this.updateSearchResult();
                    _this.offset = 0;
                    _this.search(_this.searchKey.value);
                }
                if (e.target === _this.searchResultBox.children[i].children[0].children[1]) {
                    //如果点击添加按钮则将该歌曲添加到播放列表;
                    _this.playlist.push(_this.searchResult[i]);
                    _this.updatePlaylist();
                    _this.setCurrentPlay(_this.currentPlay);
                    layer.msg('添加至播放列表')
                }
            }
        });
        this.searchBtn.addEventListener('click', function () {
            _this.searchResult = [];
            _this.searchResultBox.innerHTML = '';
            _this.offset = 0;
            _this.search(_this.searchKey.value);
        });
        this.searchKey.addEventListener('keyup', function (e) {
            if (e.keyCode === 13) {
                _this.searchResult = [];
                _this.searchResultBox.innerHTML = '';
                _this.offset = 0;
                _this.search(_this.searchKey.value);
            }
        });
        this.searchResultBox.addEventListener('scroll', function (e) {
            if (e.target.scrollHeight === e.target.offsetHeight + e.target.scrollTop) {
                _this.offset += 1;
                _this.search(_this.searchKey.value);
            }
        })
    };


    Player.prototype.playPause = function () {
        if (this.audio.ended || this.audio.paused) {
            this.play();
        } else {
            this.audio.pause();
            this.playPauseBtn.innerHTML = '&#xe9f9;';
        }
    };
    Player.prototype.updatePlaylist = function () {
        this.playlistContainer.innerHTML = '';
        var _this = this;
        this.playlist.forEach(function (item) {
            var box = document.createElement('li'),
                song = document.createElement('span'),
                singer = document.createElement('div'),
                close = document.createElement('span');
            song.innerHTML = item.title;
            singer.innerHTML = item.singer;
            close.innerHTML = '&#xebbf;';
            song.setAttribute('class', 'list-song');
            singer.setAttribute('class', 'list-singer');
            close.setAttribute('class', 'iconfont close');
            box.appendChild(song);
            box.appendChild(singer);
            box.appendChild(close);
            _this.playlistContainer.appendChild(box);
        });
    };
    Player.prototype.search = function (key) {
        var _this = this;
        layer.load(2, {shade: false});
        Bmob.Cloud.run('search', {name: key, offset: _this.offset}, {
            success: function (data) {
                var res = JSON.parse(data);
                layer.closeAll();
                if (res.code === 200 && res.result.songs) {//判断是否获取到搜索结果
                    res.result.songs.forEach(function (item) {
                        //过滤版权音乐
                        if ((item.crbt === null && item.copyrightId === 0) || item.fee === 0) {
                            _this.searchResult.push({
                                title: item.name,
                                singer: item.artists[0].name,
                                time: item.duration,
                                pic: item.album.blurPicUrl,
                                id: item.id,
                                copyright: item.fee !== 0,
                                backURL: item.mp3Url ? item.mp3Url : null
                            });
                        }
                    });
                    //显示搜索结果
                    _this.updateSearchResult();
                } else {
                    layer.msg('没有更多啦 %>_<% ')
                }
            },
            error: function (error) {
                layer.msg('服务器错误');
                console.log(error)
            }
        });
    };
    Player.prototype.updateSearchResult = function () {
        var _this = this;
        this.searchResultBox.innerHTML = '';
        this.searchResult.forEach(function (song) {
            var content = document.createElement('li'),
                opt = document.createElement('div'),
                img = document.createElement('img'),
                play = document.createElement('div'),
                add = document.createElement('div'),
                name = document.createElement('div'),
                singer = document.createElement('span');
            opt.setAttribute('class', 'opt');
            img.setAttribute('src', song.pic);
            play.setAttribute('class', 'iconfont');
            play.innerHTML = '&#xe9f9;';
            add.innerHTML = '&#xea05;';
            add.setAttribute('class', 'iconfont');
            name.innerHTML = song.title;
            name.setAttribute('class', 'search_song');
            singer.innerHTML = song.singer;
            singer.setAttribute('class', 'search_singer');
            opt.appendChild(play);
            opt.appendChild(add);
            content.appendChild(opt);
            content.appendChild(img);
            content.appendChild(name);
            content.appendChild(singer);
            _this.searchResultBox.appendChild(content)
        });
    };
    Player.prototype.play = function (music) {
        var data, that = this;
        if (arguments.length > 0) {
            Bmob.Cloud.run('getSong', {id: music.id.toString()}, {
                success: function (result) {
                    data = JSON.parse(result);
                    that.playPauseBtn.innerHTML = '&#xe9d3;';
                    if (!data.data.url) {
                        that.audio.src = music.backURL;
                        that.audio.play();
                    } else {
                        that.audio.src = data.data.url;
                        that.audio.play();
                    }
                    Bmob.Cloud.run('getLrc', {id: music.id.toString()}, {
                        success: function (json) {
                            var lrc = JSON.parse(json);
                            if (lrc.lrc) {
                                that.lyric = that.parseLyric(lrc.lrc.lyric);
                                that.lyricBox.innerHTML = 'music...';
                            } else {
                                that.lyricBox.innerHTML = '未找到匹配的歌词';
                                that.lyric = null;
                            }
                        },
                        error: function (error) {
                            layer.msg('服务器错误');
                        }
                    });
                },
                error: function (error) {
                    layer.msg('服务器错误');
                }
            });
        } else {
            that.audio.play();
            that.playPauseBtn.innerHTML = '&#xe9d3;';
        }
    };
    Player.prototype.parseLyric = function (lrc) {
        var lyrics = lrc.split("\n");
        var lrcObj = {};
        for (var i = 0; i < lyrics.length; i++) {
            var lyric = decodeURIComponent(lyrics[i]);
            var timeReg = /\[\d*:\d*((\.|\:)\d*)*\]/g;
            var timeRegExpArr = lyric.match(timeReg);
            if (!timeRegExpArr)continue;
            var clause = lyric.replace(timeReg, '');

            for (var k = 0, h = timeRegExpArr.length; k < h; k++) {
                var t = timeRegExpArr[k];
                var min = Number(String(t.match(/\[\d*/i)).slice(1)),
                    sec = Number(String(t.match(/\:\d*/i)).slice(1));
                var time = min * 60 + sec;
                lrcObj[time] = clause;
            }
        }
        return lrcObj;
    };
    Player.prototype.showLrc = function (time) {
        var lrc = this.lyric[Math.floor(time)];
        if (typeof lrc !== 'undefined') {
            this.lyricBox.innerHTML = lrc;
        }
    };
    Player.prototype.updateProgress = function () {
        this.proInner.style.width = (this.audio.currentTime / this.audio.duration * 100 + "%");
        var time = this.formatTime(this.audio.duration - this.audio.currentTime);
        this.leftTime.innerHTML = '-' + time.m + ':' + time.s;
    };
    Player.prototype.formatTime = function (time) {
        var m = Math.floor(time / 60),
            s = Math.floor(time % 60);
        if (m < 10) {
            m = '0' + m;
        }
        if (s < 10) {
            s = '0' + s;
        }
        return {m: m, s: s}
    };
    Player.prototype.playNext = function () {
        if (this.currentPlay === this.playlist.length - 1) {
            this.play(this.playlist[0]);
            this.currentPlay = 0;
        } else {
            this.play(this.playlist[this.currentPlay + 1]);
            this.currentPlay += 1;
        }
        this.setCurrentPlay(this.currentPlay);
    };
    Player.prototype.playPre = function () {
        if (this.currentPlay === 0) {
            this.play(this.playlist[this.playlist.length - 1]);
            this.currentPlay = this.playlist.length - 1;
        } else {
            this.play(this.playlist[this.currentPlay - 1]);
            this.currentPlay -= 1;
        }
        this.setCurrentPlay(this.currentPlay);
    };
    Player.prototype.setCurrentPlay = function (num) {
        var len = this.playlistContainer.children.length;
        for (var j = 0; j < len; j++) {
            this.playlistContainer.children[j].removeAttribute('class');
        }
        this.playlistContainer.children[num].setAttribute('class', 'playing');
    };
    layer.open({
        title: 'Nature Music通知',
        content: '本播放器内容来自网易云音乐，仅供学习使用。部分内容已隐藏，如有需要请前往网易云音乐。',
        closeBtn: 0,
        btn: ['我知道了', '离开'],
        yes: function () {
            Bmob.initialize("22e84dbe507a583ba7d037d3603aa4be", "09a6501fabeb11218fe31b28317d8682");
            var player = new Player(), list = ['玖月奇迹', '郑源', '唱响中国', '姚贝娜', '邓紫棋', '金玟岐', 'Coldplay', 'F.I.R'];
            player.search(list[Math.floor(Math.random() * list.length)]);
        },
        btn2: function () {
            window.close();
        }
    });
}());