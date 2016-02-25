function vp(videoNode) {

  // Incapsulated clas for internal usage
  var DOMNode = function (node) {
    //// Public methods

    this.on = function (event, handler) {
      this.el.addEventListener(event, handler);
    };

    this.applyVpState = function (classes) {
      if (!this.originalClass) {
        this.originalClass = this.el.className;
      }
      this.el.className = this.originalClass + " " + classes;
    };

    this.toggleClass = function (name, trigger) {
      if (!this.originalClass) {
        this.originalClass = this.el.className;
      }
      trigger = trigger == null ? this.el.className.indexOf(name) < 0 : trigger;

      var rule = new RegExp(" " + name, "g");

      this.el.className = this.el.className.replace(rule, "");
      this.el.className += trigger ? (" " + name) : "";
    };

    this.dragAble = function () {
      this.drag = false;

      this.dragStart = function (e) {
      };
      this.on("mousedown", function (e) {
        this.drag = true;
        this.dragStart(e);
      }.bind(this));

      this.dragEnd = function (e) {
      };
      this.on("mouseup", function (e) {
        this.drag = false;
        this.dragEnd(e);
      }.bind(this));

      this.dragMove = function (e) {
      };
      this.on("mousemove", function (e) {
        if (this.drag) {
          this.dragMove(e);
        }
      }.bind(this));
    };

    this.setProperties = function (props) {
      Object.assign(this.el, props);
    };

    this.dismount = function () {
      this.parent.el.removeChild(this.el);
      delete this.root.dom[this.el.name];
    };
    ////

    this.el = node.target || document.createElement(node.type || "div");

    this.parent = node.parent || false;

    this.root = this.parent.root || node.root;
  };

  Object.defineProperties(this, {
    availableEvents: {
      writable: false,
      configurable: false,
      enumerable: true,
      value: ["abort", "canplay", "canplaythrough", "durationchange", "emptied ", "ended", "error", "loadeddata", "loadedmetadata", "loadstart", "pause", "play", "playing", "status", "ratechange", "seeked", "seeking", "stalled", "suspend", "timeupdate", "volumechange", "waiting"]
    },
    events: {
      writable: false,
      configurable: false,
      enumerable: false,
      value: {
        suspend: function () {
          this.initSizes();
          this.setVolume(0.75);
        },
        play: function () {
          this.vpState();
        },
        pause: function () {
          this.vpState();
        },
        ended: function () {
          this.vpState();
        },
        timeupdate: function () {
          var percents = this.video.currentTime / (this.video.duration / 100);
          this.dom.progress.el.style.width = percents + "%";
        },
        volumechange: function () {
          this.vpState();
          this.dom.currVolume.el.style.width = this.video.volume * 100 + "%";
        }
      }
    },
    dom: {
      writable: false,
      configurable: false,
      enumerable: true,
      value: {}
    },
    handle: {
      writable: false,
      enumerable: true,
      configurable: false,
      value: {}
    }
  });

  Object.defineProperty(this.dom, "main", {
    enumerable: true,
    writable: false,
    configurable: false,
    value: new DOMNode({root: this})
  });
  this.dom.main.setProperties({className: "vp"});

  // dom decorator
  this.appendDom = function (name) {
    return function (node) {
      node.parent = node.parent || this.dom.main;

      this.dom[name] = new DOMNode(node);

      if (node.handlers) {
        for (var i in node.handlers) {
          this.dom[name].on(i, node.handlers[i].bind(this.dom[name]));
        }
        delete node.handlers;
      }

      if (node.dragAble) {
        this.dom[name].dragAble();
        Object.assign(this.dom[name], node.dragAble);
        delete node.dragAble;
      }

      if (node.childs) {
        for (var childNode in node.childs) {
          node.childs[childNode].parent = this.dom[name];
          this.appendDom(childNode)(node.childs[childNode]);
        }
        delete node.childs;
      }

      node.name = name;
      this.dom[name].setProperties(node);
      this.dom[name].parent.childs = this.dom[name].parent.childs || {};
      this.dom[name].parent.childs[name] = this.dom[name];
      this.dom[name].parent.el.appendChild(this.dom[name].el);

      return this.dom[name];
    }.bind(this);
  };

  this.initSizes = function () {
    this.rewindPerPX = this.video.duration / this.dom.status.el.clientWidth;
    this.volumePerPx = 100 / this.dom.volume.el.clientWidth;
  };

  //// Public methods
  this.play = function () {
    this.video.play();
  };

  this.pause = function () {
    this.video.pause();
  };

  this.replay = function () {
    this.video.currentTime = 0;
    this.play();
  };

  this.fullScreen = function () {
    if (this.dom.main.el.className.indexOf("full-screen") < 0) {
      if (this.dom.main.el.requestFullscreen) {
        this.dom.main.el.requestFullscreen();
      }
      else if (this.dom.main.el.msRequestFullscreen) {
        this.dom.main.el.msRequestFullscreen();
      }
      else if (this.dom.main.el.mozRequestFullScreen) {
        this.dom.main.el.mozRequestFullScreen();
      }
      else if (this.dom.main.el.webkitRequestFullscreen) {
        this.dom.main.el.webkitRequestFullscreen();
      }
    }
    else {
      if (document.cancelFullscreen) {
        document.cancelFullscreen();
      }
      else if (document.msCancelFullscreen) {
        document.msCancelFullscreen();
      }
      else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
      else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
    }

  };

  this.rewindTo = function (time) {
    this.video.currentTime = time;
  };

  this.setVolume = function (val) {
    this.video.muted = val <= 0;
    val = val > 1 ? val / 100 : val;
    this.video.volume = val;
  };

  this.toggleMute = function (trigger) {
    this.video.muted = trigger == null ? !this.video.muted : trigger;
    if (this.video.muted) {
      this.savedVolume = this.video.volume;
      this.setVolume(0);
    }
    else {
      this.setVolume(this.savedVolume || 0.75);
      delete this.savedVolume;
    }
  };

  this.addVideo = function (video) {
    if (this.dom.video) {
      this.dom.video.dismount();
    }

    this.availableEvents.map(function (event) {
      this.handle[event] = function () {
      };
      var callback = this.events[event] ? function () {
        this.events[event].call(this);
        this.handle[event].call(this);
      }.bind(this) : this.handle[event];

      video.addEventListener(event, callback, true);
    }.bind(this));

    this.appendDom("video")({
      target: video,
      parent: this.dom.videoBlock
    });

    if (!this.video) {
      this.video = video;
    }
  };

  this.vpState = function () {
    var vpState = [
      (this.video.paused ? "paused" : "playing"),
      (this.video.ended ? "ended" : ""),
      (this.video.muted ? "muted" : ""),
      (document.fullScreen || document.webkitIsFullScreen || document.mozFullScreen || document.msFullScreen ? "full-screen" : "")
    ].join(" ");

    this.dom.main.applyVpState(vpState);
  };
  ////


  this.appendDom("videoBlock")({
    className: "video-block",
    childs: {
      playCurtain: {
        className: "curtain play-curtain",
        handlers: {
          click: function (e) {
            this.root.play();
          }
        }
      },
      pauseCurtain: {
        className: "curtain pause-curtain",
        handlers: {
          click: function (e) {
            this.root.pause();
          }
        }
      },
      replayCurtain: {
        className: "curtain replay-curtain",
        handlers: {
          click: function (e) {
            this.root.replay();
          }
        }
      }
    }
  });

  this.appendDom("controls")({
    className: "controls",
    childs: {
      status: {
        className: "status",
        handlers: {
          click: function (e) {
            var px = e.clientX - this.el.offsetLeft;
            this.root.rewindTo(px * this.root.rewindPerPX);
          },
          mousemove: function (e) {
            var maxLeft = this.el.clientWidth - this.root.dom.preview.el.clientWidth;
            var left = e.clientX - this.el.offsetLeft;
            left = left >= maxLeft ? maxLeft : left;
            this.root.dom.preview.el.style.left = left + "px";
            var px = e.clientX - this.root.dom.status.el.offsetLeft;
            this.root.dom.preview.el.currentTime = (px * this.root.rewindPerPX);
          }
        },
        childs: {
          progress: {
            className: "progress",
            style: {
              width: "0px"
            }
          },
          preview: {
            className: "previev",
            target: videoNode.cloneNode(true)
          }
        },
        dragAble: {
          dragMove: function (e) {
            var px = e.clientX - this.root.dom.status.el.offsetLeft;
            this.root.rewindTo(px * this.root.rewindPerPX);
          }
        }
      },
      left: {
        className: "left",
        childs: {
          play: {
            className: "play",
            innerHTML: "play",
            handlers: {
              click: function () {
                this.root.play();
              }
            }
          },
          pause: {
            className: "pause",
            innerHTML: "pause",
            handlers: {
              click: function () {
                this.root.pause();
              }
            }
          },
          replay: {
            className: "replay",
            innerHTML: "replay",
            handlers: {
              click: function () {
                this.root.replay();
              }
            }
          },
        }
      },
      right: {
        className: "right",
        childs: {
          mute: {
            className: "mute",
            innerHTML: "mute",
            handlers: {
              click: function () {
                this.root.toggleMute();
              }
            }
          },
          volume: {
            className: "volume",
            handlers: {
              click: function (e) {
                var px = e.clientX - this.el.offsetLeft;
                this.root.setVolume(px * this.root.volumePerPx);
              }
            },
            dragAble: {
              dragMove: function (e) {
                var px = e.clientX - this.el.offsetLeft;
                this.root.setVolume(px * this.root.volumePerPx);
              }
            },
            childs: {
              currVolume: {
                className: "currentVolume"
              }
            }
          },
          fullScreen: {
            className: "full-screen",
            innerHTML: "Full screen",
            handlers: {
              click: function () {
                this.root.fullScreen();
              }
            }
          }
        }
      }
    }
  });

  // replacing target video with completed DOMNode
  videoNode.parentNode.insertBefore(this.dom.main.el, videoNode.nextSibling);
  this.addVideo(videoNode);

  document.addEventListener('webkitfullscreenchange', function (e) {
    this.vpState();
    this.initSizes();
  }.bind(this));
  document.addEventListener('mozfullscreenchange', function (e) {
    this.vpState();
    this.initSizes();
  }.bind(this));
  document.addEventListener('fullscreenchange', function (e) {
    this.vpState();
    this.initSizes();
  }.bind(this));
}