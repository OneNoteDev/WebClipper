(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var ClientType;
(function (ClientType) {
    ClientType[ClientType["Bookmarklet"] = 0] = "Bookmarklet";
    ClientType[ClientType["ChromeExtension"] = 1] = "ChromeExtension";
    ClientType[ClientType["EdgeExtension"] = 2] = "EdgeExtension";
    ClientType[ClientType["FirefoxExtension"] = 3] = "FirefoxExtension";
    ClientType[ClientType["SafariExtension"] = 4] = "SafariExtension";
})(ClientType = exports.ClientType || (exports.ClientType = {}));

},{}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var constants_1 = require("../constants");
var componentBase_1 = require("./componentBase");
var tooltip_1 = require("./tooltip");
var expandFromRightAnimationStrategy_1 = require("./animations/expandFromRightAnimationStrategy");
var slidingHeightAnimationStrategy_1 = require("./animations/slidingHeightAnimationStrategy");
var AnimatedTooltipClass = (function (_super) {
    __extends(AnimatedTooltipClass, _super);
    function AnimatedTooltipClass(props) {
        var _this = _super.call(this, props) || this;
        _this.tooltipAnimationStrategy = new expandFromRightAnimationStrategy_1.ExpandFromRightAnimationStrategy({
            extShouldAnimateIn: function () { return _this.state.uiExpanded; },
            extShouldAnimateOut: function () { return !_this.state.uiExpanded; },
            onAfterAnimateOut: _this.props.onAfterCollapse
        });
        _this.heightAnimationStrategy = new slidingHeightAnimationStrategy_1.SlidingHeightAnimationStrategy(_this.props.elementId, {
            onAfterHeightAnimatorDraw: _this.props.onHeightChange
        });
        return _this;
    }
    AnimatedTooltipClass.prototype.getInitialState = function () {
        return {
            uiExpanded: true
        };
    };
    AnimatedTooltipClass.prototype.closeTooltip = function () {
        this.setState({ uiExpanded: false });
        if (this.props.onCloseButtonHandler) {
            this.props.onCloseButtonHandler();
        }
    };
    AnimatedTooltipClass.prototype.onHeightAnimatorDraw = function (heightAnimator) {
        this.heightAnimationStrategy.animate(heightAnimator);
    };
    AnimatedTooltipClass.prototype.onTooltipDraw = function (tooltipElement) {
        this.tooltipAnimationStrategy.animate(tooltipElement);
    };
    AnimatedTooltipClass.prototype.render = function () {
        // We have to make the renderablePanel undefined on the collapse for the vertical shrink animation to function correctly
        var renderablePanel = ({tag: "div", attrs: Object.assign({className:constants_1.Constants.Classes.heightAnimator + " " + constants_1.Constants.Classes.clearfix},  this.onElementDraw(this.onHeightAnimatorDraw)), children: [
				this.state.uiExpanded ? this.props.renderablePanel : undefined
			]});
        return (m.component(tooltip_1.Tooltip, {brandingImage:this.props.brandingImage, elementId:this.props.elementId, title:this.props.title, onCloseButtonHandler:this.closeTooltip.bind(this), onElementDraw:this.onTooltipDraw.bind(this), renderablePanel:renderablePanel, contentClasses:this.props.contentClasses}));
    };
    return AnimatedTooltipClass;
}(componentBase_1.ComponentBase));
exports.AnimatedTooltipClass = AnimatedTooltipClass;
var component = AnimatedTooltipClass.componentize();
exports.AnimatedTooltip = component;

},{"../constants":22,"./animations/expandFromRightAnimationStrategy":6,"./animations/slidingHeightAnimationStrategy":7,"./componentBase":9,"./tooltip":15}],3:[function(require,module,exports){
"use strict";
var AnimationHelper = (function () {
    function AnimationHelper() {
    }
    AnimationHelper.stopAnimationsThen = function (el, callback) {
        Velocity.animate(el, "stop", true);
        setTimeout(callback, 1);
    };
    return AnimationHelper;
}());
exports.AnimationHelper = AnimationHelper;

},{}],4:[function(require,module,exports){
"use strict";
var AnimationState;
(function (AnimationState) {
    // Used for when elements transition in and out (i.e., the next element is replacing the first)
    AnimationState[AnimationState["GoingIn"] = 0] = "GoingIn";
    AnimationState[AnimationState["GoingOut"] = 1] = "GoingOut";
    AnimationState[AnimationState["In"] = 2] = "In";
    AnimationState[AnimationState["Out"] = 3] = "Out";
    // Used for when the same element is transitioning from one state to the next (e.g., changing dimensions)
    AnimationState[AnimationState["Transitioning"] = 4] = "Transitioning";
    AnimationState[AnimationState["Stopped"] = 5] = "Stopped";
})(AnimationState = exports.AnimationState || (exports.AnimationState = {}));

},{}],5:[function(require,module,exports){
"use strict";
var smartValue_1 = require("../../communicator/smartValue");
var animationHelper_1 = require("./animationHelper");
var animationState_1 = require("./animationState");
/**
 * Represents a strategy object for handling the animations for the given element.
 * Child classes should only have to implement the animation itself, as well as any
 * additional functional requirements, such as callbacks.
 */
var AnimationStrategy = (function () {
    function AnimationStrategy(animationDuration, animationState) {
        this.animationDuration = animationDuration;
        this.animationState = animationState || new smartValue_1.SmartValue(animationState_1.AnimationState.Stopped);
    }
    AnimationStrategy.prototype.getAnimationState = function () {
        return this.animationState.get();
    };
    AnimationStrategy.prototype.setAnimationState = function (animationState) {
        this.animationState.set(animationState);
    };
    AnimationStrategy.prototype.animate = function (el) {
        var _this = this;
        animationHelper_1.AnimationHelper.stopAnimationsThen(el, function () {
            _this.setAnimationState(animationState_1.AnimationState.Transitioning);
            _this.doAnimate(el).then(function () {
                _this.setAnimationState(animationState_1.AnimationState.Stopped);
            });
        });
    };
    return AnimationStrategy;
}());
exports.AnimationStrategy = AnimationStrategy;

},{"../../communicator/smartValue":21,"./animationHelper":3,"./animationState":4}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var constants_1 = require("../../constants");
var animationState_1 = require("./animationState");
var transitioningAnimationStrategy_1 = require("./transitioningAnimationStrategy");
/**
 * Represents an animation where elements transition in by expanding from the top right.
 * When transitioning out, the opposite happens.
 */
var ExpandFromRightAnimationStrategy = (function (_super) {
    __extends(ExpandFromRightAnimationStrategy, _super);
    function ExpandFromRightAnimationStrategy(options) {
        var _this = _super.call(this, 500 /* animationDuration */, options) || this;
        _this.animationTimeout = 100;
        _this.reverseChildAnimations = true;
        return _this;
    }
    ExpandFromRightAnimationStrategy.prototype.doAnimateIn = function (el) {
        var _this = this;
        return new Promise(function (resolve) {
            _this.reverseChildAnimations = true;
            clearTimeout(_this.animationTimeoutId);
            if (_this.options.onAnimateInExpand) {
                _this.animationTimeoutId = setTimeout(function () {
                    _this.options.onAnimateInExpand(el);
                }, _this.animationTimeout);
            }
            Velocity.animate(el, {
                opacity: 1,
                right: 20,
                width: constants_1.Constants.Styles.clipperUiWidth
            }, {
                complete: function () {
                    // The first transition is reversed; once it is done, do the normal transitions
                    _this.reverseChildAnimations = false;
                    resolve();
                },
                duration: _this.animationDuration,
                easing: "easeOutExpo"
            });
        });
    };
    ExpandFromRightAnimationStrategy.prototype.doAnimateOut = function (el) {
        var _this = this;
        return new Promise(function (resolve) {
            clearTimeout(_this.animationTimeoutId);
            _this.animationTimeoutId = setTimeout(function () {
                Velocity.animate(el, {
                    opacity: 0,
                    right: 0,
                    width: 0
                }, {
                    complete: function () {
                        resolve();
                    },
                    duration: _this.animationDuration,
                    easing: "easeOutExpo"
                });
            }, _this.animationTimeout);
        });
    };
    ExpandFromRightAnimationStrategy.prototype.intShouldAnimateIn = function (el) {
        return this.getAnimationState() === animationState_1.AnimationState.GoingOut || this.getAnimationState() === animationState_1.AnimationState.Out;
    };
    ExpandFromRightAnimationStrategy.prototype.intShouldAnimateOut = function (el) {
        return this.getAnimationState() === animationState_1.AnimationState.GoingIn || this.getAnimationState() === animationState_1.AnimationState.In;
    };
    return ExpandFromRightAnimationStrategy;
}(transitioningAnimationStrategy_1.TransitioningAnimationStrategy));
exports.ExpandFromRightAnimationStrategy = ExpandFromRightAnimationStrategy;

},{"../../constants":22,"./animationState":4,"./transitioningAnimationStrategy":8}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var animationStrategy_1 = require("./animationStrategy");
/**
 * Represents an animation where element are able to adjust their height by performing
 * a 'slide' animation.
 */
var SlidingHeightAnimationStrategy = (function (_super) {
    __extends(SlidingHeightAnimationStrategy, _super);
    function SlidingHeightAnimationStrategy(containerId, options) {
        var _this = _super.call(this, 200 /* animationDuration */) || this;
        _this.containerId = containerId;
        _this.options = options;
        return _this;
    }
    SlidingHeightAnimationStrategy.prototype.doAnimate = function (el) {
        var _this = this;
        return new Promise(function (resolve) {
            var container = document.getElementById(_this.containerId);
            var newHeightInfo = _this.getContainerTrueHeight(container, el);
            if (_this.options.onBeforeHeightAnimatorDraw) {
                _this.options.onBeforeHeightAnimatorDraw(newHeightInfo);
            }
            // If there's nothing to animate then call it good.
            if (newHeightInfo.actualPanelHeight === newHeightInfo.newPanelHeight) {
                resolve();
                return;
            }
            var delayResize = newHeightInfo.actualPanelHeight > newHeightInfo.newPanelHeight;
            if (!delayResize && _this.options.onAfterHeightAnimatorDraw) {
                _this.options.onAfterHeightAnimatorDraw(newHeightInfo);
            }
            Velocity.animate(el, {
                maxHeight: newHeightInfo.newPanelHeight,
                minHeight: newHeightInfo.newPanelHeight
            }, {
                complete: function () {
                    if (delayResize && _this.options.onAfterHeightAnimatorDraw) {
                        _this.options.onAfterHeightAnimatorDraw(newHeightInfo);
                    }
                    resolve();
                },
                duration: _this.animationDuration,
                easing: "easeOutQuad"
            });
        });
    };
    SlidingHeightAnimationStrategy.prototype.getContainerTrueHeight = function (container, heightAnimator) {
        var actualPanelHeight = parseFloat(heightAnimator.style.maxHeight.replace("px", ""));
        if (isNaN(actualPanelHeight)) {
            actualPanelHeight = 0;
        }
        // Temporarily remove these so we can calculate the destination heights.
        heightAnimator.style.maxHeight = "";
        heightAnimator.style.minHeight = "";
        // At this point the new container size has been set, so we need to grab it so that we know where to animate to.
        var newContainerHeight = container ? container.offsetHeight : 0;
        var newPanelHeight = heightAnimator.offsetHeight;
        // Now set to the height back to what it was so that there is something to animate from.
        heightAnimator.style.maxHeight = actualPanelHeight + "px";
        heightAnimator.style.minHeight = actualPanelHeight + "px";
        return { actualPanelHeight: actualPanelHeight, newContainerHeight: newContainerHeight, newPanelHeight: newPanelHeight };
    };
    return SlidingHeightAnimationStrategy;
}(animationStrategy_1.AnimationStrategy));
exports.SlidingHeightAnimationStrategy = SlidingHeightAnimationStrategy;

},{"./animationStrategy":5}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var objectUtils_1 = require("../../objectUtils");
var smartValue_1 = require("../../communicator/smartValue");
var animationHelper_1 = require("./animationHelper");
var animationState_1 = require("./animationState");
var animationStrategy_1 = require("./animationStrategy");
/**
 * Represents the family of animations where elements are able to toggle their visibility completely.
 *
 * Assumes that the decision to animate out vs animate in is relient on both external and internal
 * factors. Implementing classes will implement the internal factors, but can leave room for external
 * factors to weigh in on the decision as well.
 */
var TransitioningAnimationStrategy = (function (_super) {
    __extends(TransitioningAnimationStrategy, _super);
    function TransitioningAnimationStrategy(animationDuration, options, animationState) {
        var _this = this;
        animationState = animationState || new smartValue_1.SmartValue();
        if (objectUtils_1.ObjectUtils.isNullOrUndefined(animationState.get())) {
            animationState.set(animationState_1.AnimationState.Out);
        }
        _this = _super.call(this, animationDuration, animationState) || this;
        _this.options = options;
        return _this;
    }
    // Override
    TransitioningAnimationStrategy.prototype.animate = function (el) {
        // We only stop animations when we actually animate, so we call stopAnimationsThen
        // in the animateIn and animateOut functions instead of here
        this.doAnimate(el);
    };
    TransitioningAnimationStrategy.prototype.doAnimate = function (el) {
        if (this.options.extShouldAnimateIn() && this.intShouldAnimateIn(el)) {
            return this.animateIn(el);
        }
        else if (this.options.extShouldAnimateOut() && this.intShouldAnimateOut(el)) {
            return this.animateOut(el);
        }
    };
    TransitioningAnimationStrategy.prototype.animateIn = function (el) {
        var _this = this;
        return new Promise(function (resolve) {
            animationHelper_1.AnimationHelper.stopAnimationsThen(el, function () {
                if (_this.options.onBeforeAnimateIn) {
                    _this.options.onBeforeAnimateIn(el);
                }
                _this.setAnimationState(animationState_1.AnimationState.GoingIn);
                _this.doAnimateIn(el).then(function () {
                    _this.setAnimationState(animationState_1.AnimationState.In);
                    if (_this.options.onAfterAnimateIn) {
                        _this.options.onAfterAnimateIn(el);
                    }
                    resolve();
                });
            });
        });
    };
    TransitioningAnimationStrategy.prototype.animateOut = function (el) {
        var _this = this;
        return new Promise(function (resolve) {
            animationHelper_1.AnimationHelper.stopAnimationsThen(el, function () {
                if (_this.options.onBeforeAnimateOut) {
                    _this.options.onBeforeAnimateOut(el);
                }
                _this.setAnimationState(animationState_1.AnimationState.GoingOut);
                _this.doAnimateOut(el).then(function () {
                    _this.setAnimationState(animationState_1.AnimationState.Out);
                    if (_this.options.onAfterAnimateOut) {
                        _this.options.onAfterAnimateOut(el);
                    }
                    resolve();
                });
            });
        });
    };
    return TransitioningAnimationStrategy;
}(animationStrategy_1.AnimationStrategy));
exports.TransitioningAnimationStrategy = TransitioningAnimationStrategy;

},{"../../communicator/smartValue":21,"../../objectUtils":41,"./animationHelper":3,"./animationState":4,"./animationStrategy":5}],9:[function(require,module,exports){
"use strict";
var constants_1 = require("../constants");
var frontEndGlobals_1 = require("./frontEndGlobals");
var ComponentBase = (function () {
    function ComponentBase(props) {
        this.props = props;
        this.state = this.getInitialState();
        this.refs = {};
    }
    ComponentBase.prototype.getInitialState = function () {
        return {};
    };
    ComponentBase.prototype.setState = function (newPartialState) {
        m.startComputation();
        for (var key in newPartialState) {
            if (newPartialState.hasOwnProperty(key)) {
                this.state[key] = newPartialState[key];
            }
        }
        m.endComputation();
    };
    ComponentBase.prototype.ref = function (name) {
        var _this = this;
        return {
            config: function (element) {
                _this.refs[name] = element;
            }
        };
    };
    ComponentBase.prototype.onElementDraw = function (handleMethod) {
        // Because of the way mithril does the callbacks, we need to rescope it so that "this" points to the class
        handleMethod = handleMethod.bind(this);
        return {
            config: function (element, isInitialized) {
                handleMethod(element, !isInitialized);
            }
        };
    };
    ComponentBase.prototype.onElementFirstDraw = function (handleMethod) {
        // Because of the way mithril does the callbacks, we need to rescope it so that "this" points to the class
        handleMethod = handleMethod.bind(this);
        return {
            config: function (element, isInitialized) {
                if (!isInitialized) {
                    handleMethod(element);
                }
            }
        };
    };
    /*
     * Helper which handles tabIndex, clicks, and keyboard navigation for a component that is part of an Aria Set
    *
     * Also hides the outline if they are using a mouse, but shows it if they are using the keyboard
     * (idea from http://www.paciellogroup.com/blog/2012/04/how-to-remove-css-outlines-in-an-accessible-manner/)
     */
    ComponentBase.prototype.enableAriaInvoke = function (_a) {
        var callback = _a.callback, tabIndex = _a.tabIndex, args = _a.args, idOverride = _a.idOverride, ariaSetName = _a.ariaSetName, _b = _a.autoSelect, autoSelect = _b === void 0 ? false : _b;
        if (callback) {
            callback = callback.bind(this, args);
        }
        var invokeAttributes = this.enableInvoke({ callback: callback, tabIndex: tabIndex, args: args, idOverride: idOverride });
        var oldKeyUp = invokeAttributes.onkeyup;
        invokeAttributes.onkeyup = function (e) {
            var currentTargetElement = e.currentTarget;
            oldKeyUp(e);
            if (e.which === constants_1.Constants.KeyCodes.home) {
                var firstInSet = 1;
                ComponentBase.focusOnButton(ariaSetName, firstInSet, autoSelect);
            }
            else if (e.which === constants_1.Constants.KeyCodes.end) {
                var lastInSet = parseInt(currentTargetElement.getAttribute("aria-setsize"), 10);
                ComponentBase.focusOnButton(ariaSetName, lastInSet, autoSelect);
            }
            var posInSet = parseInt(currentTargetElement.getAttribute("aria-posinset"), 10);
            if (e.which === constants_1.Constants.KeyCodes.up || e.which === constants_1.Constants.KeyCodes.left) {
                if (posInSet <= 1) {
                    return;
                }
                var nextPosInSet = posInSet - 1;
                ComponentBase.focusOnButton(ariaSetName, nextPosInSet, autoSelect);
            }
            else if (e.which === constants_1.Constants.KeyCodes.down || e.which === constants_1.Constants.KeyCodes.right) {
                var setSize = parseInt(currentTargetElement.getAttribute("aria-setsize"), 10);
                if (posInSet >= setSize) {
                    return;
                }
                var nextPosInSet = posInSet + 1;
                ComponentBase.focusOnButton(ariaSetName, nextPosInSet, autoSelect);
            }
        };
        invokeAttributes["data-" + constants_1.Constants.CustomHtmlAttributes.setNameForArrowKeyNav] = ariaSetName;
        return invokeAttributes;
    };
    /*
     * Helper which handles tabIndex, clicks, and keyboard navigation.
     *
     * Also hides the outline if they are using a mouse, but shows it if they are using the keyboard
     * (idea from http://www.paciellogroup.com/blog/2012/04/how-to-remove-css-outlines-in-an-accessible-manner/)
     *
     * Example use:
     *      <a id="myCoolButton" {...this.enableInvoke(this.myButtonHandler, 0)}>Click Me</a>
     */
    ComponentBase.prototype.enableInvoke = function (_a) {
        var callback = _a.callback, tabIndex = _a.tabIndex, args = _a.args, idOverride = _a.idOverride;
        // Because of the way mithril does the callbacks, we need to rescope it so that "this" points to the class
        if (callback) {
            callback = callback.bind(this, args);
        }
        return {
            onclick: function (e) {
                var element = e.currentTarget;
                ComponentBase.triggerSelection(element, idOverride, callback, e);
            },
            onkeyup: function (e) {
                var element = e.currentTarget;
                if (e.which === constants_1.Constants.KeyCodes.enter || e.which === constants_1.Constants.KeyCodes.space) {
                    // Hitting Enter on <a> tags that contains an href automatically fire the click event, so don't do it again
                    if (!(element.tagName === "A" && element.hasAttribute("href"))) {
                        ComponentBase.triggerSelection(element, undefined, callback, e);
                    }
                }
                else if (e.which === constants_1.Constants.KeyCodes.tab) {
                    // Since they are using the keyboard, revert to the default value of the outline so it is visible
                    element.style.outlineStyle = "";
                }
            },
            onkeydown: function (e) {
                if (e.which === constants_1.Constants.KeyCodes.space || e.which === constants_1.Constants.KeyCodes.up
                    || e.which === constants_1.Constants.KeyCodes.down || e.which === constants_1.Constants.KeyCodes.left
                    || e.which === constants_1.Constants.KeyCodes.right || e.which === constants_1.Constants.KeyCodes.home
                    || e.which === constants_1.Constants.KeyCodes.end) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            },
            onmousedown: function (e) {
                var element = e.currentTarget;
                element.style.outlineStyle = "none";
            },
            tabIndex: tabIndex
        };
    };
    ComponentBase.triggerSelection = function (element, idOverride, callback, e) {
        // Intentionally sending click event before handling the method
        // TODO replace this comment with a test that validates the call order is correct
        var id = idOverride ? idOverride : element.id;
        frontEndGlobals_1.Clipper.logger.logClickEvent(id);
        if (callback) {
            callback(e);
        }
    };
    ComponentBase.focusOnButton = function (setNameForArrowKeyNav, posInSet, autoSelect) {
        var buttons = document.querySelectorAll("[data-" + constants_1.Constants.CustomHtmlAttributes.setNameForArrowKeyNav + "=" + setNameForArrowKeyNav + "]");
        for (var i = 0; i < buttons.length; i++) {
            var selectable = buttons[i];
            var ariaIntForEach = parseInt(selectable.getAttribute("aria-posinset"), 10);
            if (ariaIntForEach === posInSet) {
                selectable.style.outlineStyle = "";
                autoSelect ? selectable.click() : selectable.focus();
                return;
            }
        }
    };
    // Note: currently all components NEED either a child or attribute to work with the MSX transformer.
    // This <MyButton/> won't work, but this <MyButton dummyProp /> will work.
    ComponentBase.componentize = function () {
        var _this = this;
        var returnValue = function () {
        };
        returnValue.controller = function (props) {
            // Instantiate an instance of the inheriting class
            return new _this(props);
        };
        returnValue.view = function (controller, props) {
            controller.props = props;
            return controller.render();
        };
        return returnValue;
    };
    return ComponentBase;
}());
exports.ComponentBase = ComponentBase;

},{"../constants":22,"./frontEndGlobals":11}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var constants_1 = require("../../constants");
var extensionUtils_1 = require("../../extensions/extensionUtils");
var localization_1 = require("../../localization/localization");
var componentBase_1 = require("../componentBase");
var CloseButtonClass = (function (_super) {
    __extends(CloseButtonClass, _super);
    function CloseButtonClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CloseButtonClass.prototype.getInitialState = function () {
        return {};
    };
    CloseButtonClass.prototype.render = function () {
        return ({tag: "div", attrs: {id:constants_1.Constants.Ids.closeButtonContainer}, children: [
				{tag: "a", attrs: Object.assign({id:constants_1.Constants.Ids.closeButton, role:"button", "aria-label":localization_1.Localization.getLocalizedString("WebClipper.Action.CloseTheClipper"), title:localization_1.Localization.getLocalizedString("WebClipper.Action.CloseTheClipper")},  this.enableInvoke({ callback: this.props.onClickHandler, tabIndex: 300, args: this.props.onClickHandlerParams })), children: [
					{tag: "img", attrs: {className:"closeButtonIcon", src:extensionUtils_1.ExtensionUtils.getImageResourceUrl("close.png")}}
				]}
			]});
    };
    return CloseButtonClass;
}(componentBase_1.ComponentBase));
var component = CloseButtonClass.componentize();
exports.CloseButton = component;

},{"../../constants":22,"../../extensions/extensionUtils":23,"../../localization/localization":25,"../componentBase":9}],11:[function(require,module,exports){
"use strict";
var smartValue_1 = require("../communicator/smartValue");
var remoteStorage_1 = require("../storage/remoteStorage");
var Clipper = (function () {
    function Clipper() {
    }
    Clipper.getUserSessionId = function () {
        return Clipper.sessionId.get();
    };
    Clipper.getUserSessionIdWhenDefined = function () {
        return new Promise(function (resolve) {
            var sessionId = Clipper.sessionId.get();
            if (sessionId) {
                resolve(sessionId);
            }
            else {
                Clipper.sessionId.subscribe(function (definedSessionId) {
                    resolve(definedSessionId);
                }, { times: 1, callOnSubscribe: false });
            }
        });
    };
    Clipper.getInjectCommunicator = function () {
        return Clipper.injectCommunicator;
    };
    Clipper.setInjectCommunicator = function (injectCommunicator) {
        Clipper.injectCommunicator = injectCommunicator;
    };
    Clipper.getExtensionCommunicator = function () {
        return Clipper.extensionCommunicator;
    };
    Clipper.setExtensionCommunicator = function (extensionCommunicator) {
        Clipper.extensionCommunicator = extensionCommunicator;
        Clipper.setUpRemoteStorage(extensionCommunicator);
    };
    Clipper.getCachedValue = function (key) {
        if (!Clipper.storage) {
            throw new Error("The remote storage needs to be set up with the extension communicator first");
        }
        return Clipper.storage.getCachedValue(key);
    };
    Clipper.getStoredValue = function (key, callback, cacheValue) {
        if (!Clipper.storage) {
            throw new Error("The remote storage needs to be set up with the extension communicator first");
        }
        Clipper.storage.getValue(key, callback, cacheValue);
    };
    Clipper.preCacheStoredValues = function (storageKeys) {
        if (!Clipper.storage) {
            throw new Error("The remote storage needs to be set up with the extension communicator first");
        }
        Clipper.storage.getValues(storageKeys, function () { }, true);
    };
    Clipper.storeValue = function (key, value) {
        if (!Clipper.storage) {
            throw new Error("The remote storage needs to be set up with the extension communicator first");
        }
        Clipper.storage.setValue(key, value, undefined);
    };
    Clipper.setUpRemoteStorage = function (extensionCommunicator) {
        Clipper.storage = new remoteStorage_1.RemoteStorage(Clipper.getExtensionCommunicator());
    };
    return Clipper;
}());
Clipper.sessionId = new smartValue_1.SmartValue();
exports.Clipper = Clipper;

},{"../communicator/smartValue":21,"../storage/remoteStorage":43}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var constants_1 = require("../constants");
var polyfills_1 = require("../polyfills");
var communicator_1 = require("../communicator/communicator");
var iframeMessageHandler_1 = require("../communicator/iframeMessageHandler");
var localization_1 = require("../localization/localization");
var Log = require("../logging/log");
var communicatorLoggerPure_1 = require("../logging/communicatorLoggerPure");
var frontEndGlobals_1 = require("./frontEndGlobals");
var componentBase_1 = require("./componentBase");
var tooltipRenderer_1 = require("./tooltipRenderer");
var tooltipType_1 = require("./tooltipType");
/**
 * Root component of the Page Nav experience. Has the responsibility of initialization, and does not
 * render any UI itself.
 */
var PageNavClass = (function (_super) {
    __extends(PageNavClass, _super);
    function PageNavClass(props) {
        var _this = _super.call(this, props) || this;
        _this.initializeCommunicators();
        _this.setFrontLoadedLocalizedStrings();
        _this.getAndStoreDataFromExtension();
        return _this;
    }
    PageNavClass.prototype.getInitialState = function () {
        return {};
    };
    PageNavClass.prototype.onClosePageNavButton = function () {
        var closeEvent = new Log.Event.BaseEvent(Log.Event.Label.ClosePageNavTooltip);
        closeEvent.setCustomProperty(Log.PropertyName.Custom.PageNavTooltipType, this.state.tooltipToRender ? tooltipType_1.TooltipType[this.state.tooltipToRender] : "unknown");
        frontEndGlobals_1.Clipper.logger.logEvent(closeEvent);
    };
    PageNavClass.prototype.closePageNav = function () {
        frontEndGlobals_1.Clipper.getInjectCommunicator().callRemoteFunction(constants_1.Constants.FunctionKeys.closePageNavTooltip);
    };
    PageNavClass.prototype.getAndStoreDataFromExtension = function () {
        var _this = this;
        frontEndGlobals_1.Clipper.getExtensionCommunicator().callRemoteFunction(constants_1.Constants.FunctionKeys.getTooltipToRenderInPageNav, {
            callback: function (tooltipType) {
                _this.setState({ tooltipToRender: tooltipType });
            }
        });
        frontEndGlobals_1.Clipper.getExtensionCommunicator().callRemoteFunction(constants_1.Constants.FunctionKeys.getPageNavTooltipProps, {
            callback: function (tooltipProps) {
                _this.setState({ tooltipProps: tooltipProps });
            }
        });
    };
    PageNavClass.prototype.initializeCommunicators = function () {
        frontEndGlobals_1.Clipper.setInjectCommunicator(new communicator_1.Communicator(new iframeMessageHandler_1.IFrameMessageHandler(function () { return parent; }), constants_1.Constants.CommunicationChannels.pageNavInjectedAndPageNavUi));
        frontEndGlobals_1.Clipper.setExtensionCommunicator(new communicator_1.Communicator(new iframeMessageHandler_1.IFrameMessageHandler(function () { return parent; }), constants_1.Constants.CommunicationChannels.extensionAndPageNavUi));
        frontEndGlobals_1.Clipper.logger = new communicatorLoggerPure_1.CommunicatorLoggerPure(frontEndGlobals_1.Clipper.getExtensionCommunicator());
    };
    PageNavClass.prototype.setFrontLoadedLocalizedStrings = function () {
        frontEndGlobals_1.Clipper.getExtensionCommunicator().callRemoteFunction(constants_1.Constants.FunctionKeys.clipperStringsFrontLoaded, {
            callback: function (locStringsObj) {
                localization_1.Localization.setLocalizedStrings(locStringsObj);
            }
        });
    };
    PageNavClass.prototype.updateFrameHeight = function (newHeightInfo) {
        frontEndGlobals_1.Clipper.getInjectCommunicator().callRemoteFunction(constants_1.Constants.FunctionKeys.updateFrameHeight, {
            param: newHeightInfo.newContainerHeight
        });
    };
    PageNavClass.prototype.render = function () {
        return (m.component(tooltipRenderer_1.TooltipRenderer, {onCloseButtonHandler:this.onClosePageNavButton.bind(this), onHeightChange:this.updateFrameHeight.bind(this), onTooltipClose:this.closePageNav.bind(this), tooltipToRender:this.state.tooltipToRender, tooltipProps:this.state.tooltipProps}));
    };
    return PageNavClass;
}(componentBase_1.ComponentBase));
polyfills_1.Polyfills.init();
// Catch any unhandled exceptions and log them
var oldOnError = window.onerror;
window.onerror = function (message, filename, lineno, colno, error) {
    var callStack = error ? Log.Failure.getStackTrace(error) : "[unknown stacktrace]";
    frontEndGlobals_1.Clipper.logger.logFailure(Log.Failure.Label.UnhandledExceptionThrown, Log.Failure.Type.Unexpected, { error: message + " (" + filename + ":" + lineno + ":" + colno + ") at " + callStack }, "PageNavUI");
    if (oldOnError) {
        oldOnError(message, filename, lineno, colno, error);
    }
};
var component = PageNavClass.componentize();
exports.PageNav = component;
m.mount(document.getElementById("pageNavUIPlaceholder"), component);

},{"../communicator/communicator":18,"../communicator/iframeMessageHandler":19,"../constants":22,"../localization/localization":25,"../logging/communicatorLoggerPure":26,"../logging/log":27,"../polyfills":42,"./componentBase":9,"./frontEndGlobals":11,"./tooltipRenderer":16,"./tooltipType":17}],13:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var constants_1 = require("../../constants");
var localization_1 = require("../../localization/localization");
var componentBase_1 = require("../componentBase");
var ChangeLogPanelClass = (function (_super) {
    __extends(ChangeLogPanelClass, _super);
    function ChangeLogPanelClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ChangeLogPanelClass.prototype.getInitialState = function () {
        return {};
    };
    ChangeLogPanelClass.prototype.createChangeElement = function (change) {
        var image = change.imageUrl ?
            {tag: "img", attrs: {src:change.imageUrl}} :
            undefined;
        return ({tag: "div", attrs: {className:constants_1.Constants.Classes.change}, children: [
				image ?
            {tag: "div", attrs: {className:constants_1.Constants.Classes.changeImage}, children: [
						image
					]} :
            undefined, 
				{tag: "div", attrs: {className:constants_1.Constants.Classes.changeBody}, children: [
					{tag: "div", attrs: {className:constants_1.Constants.Classes.changeTitle}, children: [
						{tag: "span", attrs: {className:"changeTitleFont", style:localization_1.Localization.getFontFamilyAsStyle(localization_1.Localization.FontFamily.Semibold)}, children: [
							change.title
						]}
					]}, 
					{tag: "div", attrs: {className:constants_1.Constants.Classes.changeDescription}, children: [
						{tag: "span", attrs: {className:"changeDescriptionFont", style:localization_1.Localization.getFontFamilyAsStyle(localization_1.Localization.FontFamily.Regular)}, children: [
							change.description
						]}
					]}
				]}
			]});
    };
    ChangeLogPanelClass.prototype.getChangeElements = function () {
        var changeElements = [];
        for (var i = 0; i < this.props.updates.length; i++) {
            for (var j = 0; j < this.props.updates[i].changes.length; j++) {
                changeElements.push(this.createChangeElement(this.props.updates[i].changes[j]));
            }
        }
        return changeElements;
    };
    ChangeLogPanelClass.prototype.render = function () {
        return ({tag: "div", attrs: {className:constants_1.Constants.Classes.changes}, children: [
				this.getChangeElements()
			]});
    };
    return ChangeLogPanelClass;
}(componentBase_1.ComponentBase));
var component = ChangeLogPanelClass.componentize();
exports.ChangeLogPanel = component;

},{"../../constants":22,"../../localization/localization":25,"../componentBase":9}],14:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var componentBase_1 = require("../componentBase");
var constants_1 = require("../../constants");
var objectUtils_1 = require("../../objectUtils");
var localization_1 = require("../../localization/localization");
var DialogPanelClass = (function (_super) {
    __extends(DialogPanelClass, _super);
    function DialogPanelClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DialogPanelClass.prototype.getExtraMessages = function () {
        return undefined;
    };
    DialogPanelClass.prototype.onPanelAnimatorDraw = function (panelAnimator) {
        if (this.props.panelAnimationStrategy) {
            this.props.panelAnimationStrategy.animate(panelAnimator);
        }
    };
    DialogPanelClass.prototype.render = function () {
        var _this = this;
        var fontFamily = !objectUtils_1.ObjectUtils.isNullOrUndefined(this.props.fontFamily) ? this.props.fontFamily : localization_1.Localization.FontFamily.Semibold;
        var buttonFontFamily = !objectUtils_1.ObjectUtils.isNullOrUndefined(this.props.buttonFontFamily) ? this.props.buttonFontFamily : localization_1.Localization.FontFamily.Semibold;
        var containerId = this.props.containerId ? this.props.containerId : "";
        return ({tag: "div", attrs: {id:containerId}, children: [
				{tag: "div", attrs: Object.assign({className:constants_1.Constants.Classes.panelAnimator},  this.onElementDraw(this.onPanelAnimatorDraw)), children: [
					{tag: "div", attrs: {id:constants_1.Constants.Ids.dialogMessageContainer, className:"resultPagePadding"}, children: [
						{tag: "div", attrs: {className:"messageLabelContainer", style:localization_1.Localization.getFontFamilyAsStyle(fontFamily)}, children: [
							{tag: "div", attrs: {id:constants_1.Constants.Ids.dialogMessage, className:"dialogMessageFont messageLabel", role:"alert"}, children: [
								this.props.message
							]}, 
							this.getExtraMessages()
						]}
					]}, 
					{tag: "div", attrs: {id:constants_1.Constants.Ids.dialogContentContainer, className:""}, children: [
						this.props.content
					]}, 
					{tag: "div", attrs: {id:constants_1.Constants.Ids.dialogButtonContainer}, children: [
						this.props.buttons.map(function (button, i) {
            return ({tag: "div", attrs: {id:button.id, className:"wideButtonContainer dialogButton"}, children: [
									{tag: "a", attrs: Object.assign({className:"wideButtonFont wideActionButton", role:"button"},  _this.enableInvoke({ callback: button.handler, tabIndex: 70 }),{style:localization_1.Localization.getFontFamilyAsStyle(buttonFontFamily)}), children: [
										button.label
									]}
								]});
        })
					]}
				]}
			]});
    };
    return DialogPanelClass;
}(componentBase_1.ComponentBase));
exports.DialogPanelClass = DialogPanelClass;
var component = DialogPanelClass.componentize();
exports.DialogPanel = component;

},{"../../constants":22,"../../localization/localization":25,"../../objectUtils":41,"../componentBase":9}],15:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var localization_1 = require("../localization/localization");
var componentBase_1 = require("./componentBase");
var closeButton_1 = require("./components/closeButton");
/**
 * Renders content with consistent tooltip styling
 */
var TooltipClass = (function (_super) {
    __extends(TooltipClass, _super);
    function TooltipClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TooltipClass.prototype.getInitialState = function () {
        return {};
    };
    TooltipClass.prototype.render = function () {
        var additionalContentClasses = "";
        if (this.props.contentClasses) {
            additionalContentClasses = this.props.contentClasses.join(" ");
        }
        return ({tag: "div", attrs: Object.assign({id:this.props.elementId, className:"tooltip"},  this.onElementDraw(this.props.onElementDraw)), children: [
				this.props.brandingImage, 
				this.props.title ? {tag: "div", attrs: {style:localization_1.Localization.getFontFamilyAsStyle(localization_1.Localization.FontFamily.Semibold), className:"tooltip-title"}, children: [this.props.title]} : undefined, 
				m.component(closeButton_1.CloseButton, {onClickHandler:this.props.onCloseButtonHandler, onClickHandlerParams:undefined}), 
				{tag: "div", attrs: {className:"tooltip-content " + additionalContentClasses}, children: [
					this.props.renderablePanel
				]}
			]});
    };
    return TooltipClass;
}(componentBase_1.ComponentBase));
exports.TooltipClass = TooltipClass;
var component = TooltipClass.componentize();
exports.Tooltip = component;

},{"../localization/localization":25,"./componentBase":9,"./components/closeButton":10}],16:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var constants_1 = require("../constants");
var extensionUtils_1 = require("../extensions/extensionUtils");
var invokeSource_1 = require("../extensions/invokeSource");
var localization_1 = require("../localization/localization");
var frontEndGlobals_1 = require("./frontEndGlobals");
var componentBase_1 = require("./componentBase");
var animatedTooltip_1 = require("./animatedTooltip");
var tooltipType_1 = require("./tooltipType");
var changeLogPanel_1 = require("./panels/changeLogPanel");
var dialogPanel_1 = require("./panels/dialogPanel");
var TooltipRendererClass = (function (_super) {
    __extends(TooltipRendererClass, _super);
    function TooltipRendererClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TooltipRendererClass.prototype.getInitialState = function () {
        return {};
    };
    TooltipRendererClass.prototype.getChangeLogPanel = function () {
        var whatsNewProps = this.props.tooltipProps;
        var handleProceedToWebClipperButton = function () {
            frontEndGlobals_1.Clipper.getExtensionCommunicator().callRemoteFunction(constants_1.Constants.FunctionKeys.invokeClipperFromPageNav, {
                param: invokeSource_1.InvokeSource.WhatsNewTooltip
            });
        };
        return ({tag: "div", attrs: {}, children: [
				m.component(changeLogPanel_1.ChangeLogPanel, {updates:whatsNewProps.updates}), 
				{tag: "div", attrs: {className:"wideButtonContainer changelog-button"}, children: [
					{tag: "a", attrs: Object.assign({id:constants_1.Constants.Ids.proceedToWebClipperButton},  this.enableInvoke({ callback: handleProceedToWebClipperButton, tabIndex: 10 })), children: [
						{tag: "span", attrs: {className:"wideButtonFont wideActionButton", style:localization_1.Localization.getFontFamilyAsStyle(localization_1.Localization.FontFamily.Semibold)}, children: [
							localization_1.Localization.getLocalizedString("WebClipper.Label.ProceedToWebClipperFun")
						]}
					]}
				]}
			]});
    };
    TooltipRendererClass.prototype.getContentClasses = function () {
        var currentPanel = this.getCurrentPanelType();
        var classes = [];
        switch (currentPanel) {
            case tooltipType_1.TooltipType.Pdf:
            /* falls through */
            case tooltipType_1.TooltipType.Product:
            /* falls through */
            case tooltipType_1.TooltipType.Recipe:
            /* falls through */
            case tooltipType_1.TooltipType.Video:
                classes.push("tooltip-upsell");
                return classes;
            case tooltipType_1.TooltipType.ChangeLog:
                classes.push("changelog-content");
                return classes;
            default:
                return classes;
        }
    };
    TooltipRendererClass.prototype.getCurrentPanelType = function () {
        return this.state.hasOwnProperty("tooltipToRenderOverride") ? this.state.tooltipToRenderOverride : this.props.tooltipToRender;
    };
    TooltipRendererClass.prototype.getCurrentTitle = function () {
        var currentPanel = this.getCurrentPanelType();
        switch (currentPanel) {
            case tooltipType_1.TooltipType.ChangeLog:
                return localization_1.Localization.getLocalizedString("WebClipper.Label.WhatsNew");
            default:
                return "";
        }
    };
    TooltipRendererClass.prototype.getTooltipPanel = function (tooltipType) {
        var handleProceedToWebClipperButton = function () {
            frontEndGlobals_1.Clipper.getExtensionCommunicator().callRemoteFunction(constants_1.Constants.FunctionKeys.invokeClipperFromPageNav, {
                param: tooltipType_1.TooltipTypeUtils.toInvokeSource(tooltipType)
            });
        };
        var tooltipAsString = tooltipType_1.TooltipType[tooltipType];
        var tooltipImagePath = "tooltips/" + tooltipAsString + ".png";
        tooltipImagePath = tooltipImagePath.toLowerCase();
        var content = [({tag: "img", attrs: {className:"tooltip-image", src:extensionUtils_1.ExtensionUtils.getImageResourceUrl(tooltipImagePath)}})];
        var buttons = [{
                id: constants_1.Constants.Ids.proceedToWebClipperButton,
                label: localization_1.Localization.getLocalizedString("WebClipper.Label.ProceedToWebClipperFun"),
                handler: handleProceedToWebClipperButton
            }];
        var message = "WebClipper.Label." + tooltipAsString + "Tooltip";
        return m.component(dialogPanel_1.DialogPanel, {message:localization_1.Localization.getLocalizedString(message), content:content, buttons:buttons, fontFamily:localization_1.Localization.FontFamily.Semilight});
    };
    TooltipRendererClass.prototype.getWhatsNewPanel = function () {
        var _this = this;
        var onShowChangeLogButton = function () {
            _this.setState({ tooltipToRenderOverride: tooltipType_1.TooltipType.ChangeLog });
        };
        var buttons = [{
                id: constants_1.Constants.Ids.checkOutWhatsNewButton,
                label: localization_1.Localization.getLocalizedString("WebClipper.Label.OpenChangeLogFromTooltip"),
                handler: onShowChangeLogButton.bind(this)
            }];
        return m.component(dialogPanel_1.DialogPanel, {message:localization_1.Localization.getLocalizedString("WebClipper.Label.WebClipperWasUpdatedFun"), buttons:buttons});
    };
    TooltipRendererClass.prototype.createTooltipPanelToShow = function () {
        var currentPanel = this.getCurrentPanelType();
        if (currentPanel === undefined) {
            return undefined;
        }
        switch (currentPanel) {
            case tooltipType_1.TooltipType.WhatsNew:
                return this.getWhatsNewPanel();
            case tooltipType_1.TooltipType.ChangeLog:
                return this.getChangeLogPanel();
            default:
                return this.getTooltipPanel(currentPanel);
        }
    };
    TooltipRendererClass.prototype.getBrandingImage = function () {
        var currentPanel = this.getCurrentPanelType();
        switch (currentPanel) {
            case tooltipType_1.TooltipType.ChangeLog:
                return undefined;
            default:
                return ({tag: "div", attrs: {id:constants_1.Constants.Ids.brandingContainer}, children: [
						{tag: "p", attrs: {className:"tooltip-corner-branding"}, children: [
							{tag: "img", attrs: {src:extensionUtils_1.ExtensionUtils.getImageResourceUrl("tooltips/onenote_tooltip_branding.png")}}
						]}
					]});
        }
    };
    TooltipRendererClass.prototype.render = function () {
        return (m.component(animatedTooltip_1.AnimatedTooltip, {brandingImage:this.getBrandingImage(), elementId:constants_1.Constants.Ids.pageNavAnimatedTooltip, title:this.getCurrentTitle(), onAfterCollapse:this.props.onTooltipClose, onCloseButtonHandler:this.props.onCloseButtonHandler, onHeightChange:this.props.onHeightChange, renderablePanel:this.createTooltipPanelToShow(), contentClasses:this.getContentClasses()}));
    };
    return TooltipRendererClass;
}(componentBase_1.ComponentBase));
var component = TooltipRendererClass.componentize();
exports.TooltipRenderer = component;

},{"../constants":22,"../extensions/extensionUtils":23,"../extensions/invokeSource":24,"../localization/localization":25,"./animatedTooltip":2,"./componentBase":9,"./frontEndGlobals":11,"./panels/changeLogPanel":13,"./panels/dialogPanel":14,"./tooltipType":17}],17:[function(require,module,exports){
"use strict";
var invokeSource_1 = require("../extensions/invokeSource");
var TooltipType;
(function (TooltipType) {
    TooltipType[TooltipType["ChangeLog"] = 0] = "ChangeLog";
    TooltipType[TooltipType["Pdf"] = 1] = "Pdf";
    TooltipType[TooltipType["Product"] = 2] = "Product";
    TooltipType[TooltipType["Recipe"] = 3] = "Recipe";
    TooltipType[TooltipType["Video"] = 4] = "Video";
    TooltipType[TooltipType["WhatsNew"] = 5] = "WhatsNew";
})(TooltipType = exports.TooltipType || (exports.TooltipType = {}));
var TooltipTypeUtils;
(function (TooltipTypeUtils) {
    function toInvokeSource(tooltipType) {
        switch (tooltipType) {
            case TooltipType.Pdf:
                return invokeSource_1.InvokeSource.PdfTooltip;
            case TooltipType.Product:
                return invokeSource_1.InvokeSource.ProductTooltip;
            case TooltipType.Recipe:
                return invokeSource_1.InvokeSource.RecipeTooltip;
            case TooltipType.Video:
                return invokeSource_1.InvokeSource.VideoTooltip;
            case TooltipType.WhatsNew:
                return invokeSource_1.InvokeSource.WhatsNewTooltip;
            default:
                throw Error("Invalid TooltipType passed in TooltipType.toInvokeSource");
        }
    }
    TooltipTypeUtils.toInvokeSource = toInvokeSource;
})(TooltipTypeUtils = exports.TooltipTypeUtils || (exports.TooltipTypeUtils = {}));

},{"../extensions/invokeSource":24}],18:[function(require,module,exports){
"use strict";
/**
 * Communication interface for handling message passing between two scripts (separate windows, extensions, etc...)
 */
var Communicator = (function () {
    function Communicator(messageHandler, channel) {
        this.otherSideKeys = {};
        this.queuedCalls = {};
        // We do not want to override the callback if we call a remote function more than once, so each
        // time we register a callback, we need to add this and increment it accordingly.
        this.callbackIdPostfix = 0;
        this.functionMap = {};
        this.svFunctions = {};
        this.trackedSmartValues = {};
        this.channel = channel;
        this.messageHandler = messageHandler;
        this.messageHandler.onMessageReceived = this.parseMessage.bind(this);
        this.sendInitializationMessage();
    }
    Communicator.prototype.getMessageHandler = function () {
        return this.messageHandler;
    };
    /*
     * Event handler for when the other side has responded
     */
    Communicator.prototype.onInitialized = function () {
    };
    /**
     * Does any cleanup work needed
     */
    Communicator.prototype.tearDown = function () {
        // Unsubscribe to SVs
        for (var svKey in this.trackedSmartValues) {
            if (this.trackedSmartValues.hasOwnProperty(svKey)) {
                if (this.svFunctions[svKey]) {
                    for (var i = 0; i < this.svFunctions[svKey].length; i++) {
                        this.trackedSmartValues[svKey].unsubscribe(this.svFunctions[svKey][i]);
                    }
                }
            }
        }
        this.messageHandler.tearDown();
    };
    /**
     * Sets the error handler for when trying to communicate throws an error
     */
    Communicator.prototype.setErrorHandler = function (errorHandler) {
        this.communicatorErrorHandler = errorHandler;
    };
    /**
     * Parses the message and determines what action to take
     */
    Communicator.prototype.parseMessage = function (dataString) {
        var dataPackage;
        try {
            dataPackage = JSON.parse(dataString);
        }
        catch (error) {
            // Ignore messages that aren't in the expected format
            return;
        }
        // If it came from myself, ignore it :)
        if (!dataPackage) {
            return;
        }
        // If we specified a channel, then check it, if we didn't, then we ignore anything with one
        if ((this.channel && (!dataPackage.channel || dataPackage.channel !== this.channel)) ||
            (!this.channel && dataPackage.channel)) {
            return;
        }
        try {
            this.handleDataPackage(dataPackage);
        }
        catch (e) {
            if (this.communicatorErrorHandler) {
                this.communicatorErrorHandler(e);
            }
            else {
                throw e;
            }
        }
    };
    /**
     * Determines the correct way to handle the given data package.
     */
    Communicator.prototype.handleDataPackage = function (dataPackage) {
        var _this = this;
        if (dataPackage.functionKey === Communicator.initializationKey) {
            // The other side is coming online; acknowledge, and tell it about our existing functions
            this.sendAcknowledgementMessage();
            for (var functionName in this.functionMap) {
                if (this.functionMap.hasOwnProperty(functionName)) {
                    this.postMessage({ data: functionName, functionKey: Communicator.registrationKey });
                }
            }
            // Both sides are online now (we were first)
            this.onInitialized();
        }
        else if (dataPackage.functionKey === Communicator.acknowledgeKey) {
            // Both sides are online now (we were second)
            this.onInitialized();
        }
        else if (dataPackage.functionKey === Communicator.registrationKey) {
            // The other side is registering a function with us.
            var newKey = dataPackage.data.toString();
            if (!this.otherSideKeys[newKey]) {
                this.otherSideKeys[newKey] = true;
            }
            if (this.isSmartValueSubscription(newKey)) {
                // Make sure we immediately pass the latest value we have
                var smartValueName = newKey.substr(Communicator.setValuePrefix.length);
                var smartValue = this.trackedSmartValues[smartValueName];
                if (smartValue) {
                    this.updateRemoteSmartValue(smartValueName, smartValue.get());
                }
            }
            else if (this.queuedCalls[newKey]) {
                // Pass any calls to that function that we had saved up
                var calls = this.queuedCalls[newKey];
                for (var i = 0; i < calls.length; i++) {
                    this.postMessage(calls[i]);
                }
                delete this.queuedCalls[newKey];
            }
        }
        else {
            // Handle a normal function call from the other side
            var func = this.functionMap[dataPackage.functionKey];
            if (func) {
                var promiseResult = func(dataPackage.data);
                if (promiseResult && promiseResult.then && dataPackage.callbackKey) {
                    promiseResult.then(function (result) {
                        _this.callRemoteFunction(dataPackage.callbackKey, { param: result });
                    }, function (error) {
                        _this.callRemoteFunction(dataPackage.callbackKey, { param: error });
                    });
                }
            }
        }
    };
    /**
     * Registers a function name that can be called from the remote
     */
    Communicator.prototype.registerFunction = function (name, func) {
        if (!name) {
            throw new Error("param 'name' is invalid");
        }
        this.functionMap[name] = func;
        this.postMessage({ data: name, functionKey: Communicator.registrationKey });
    };
    /**
     * Triggers the call of a remote function that was registered with the given name
     */
    Communicator.prototype.callRemoteFunction = function (name, options) {
        if (!name) {
            throw new Error("param 'name' is invalid");
        }
        var paramData = options ? options.param : undefined;
        var callbackKey = undefined;
        if (options && options.callback) {
            callbackKey = name + Communicator.callbackPostfix + "-" + this.callbackIdPostfix++;
            this.registerFunction(callbackKey, options.callback);
        }
        var dataPackage = { data: paramData, functionKey: name };
        if (callbackKey) {
            dataPackage.callbackKey = callbackKey;
        }
        if (this.otherSideKeys[name]) {
            this.postMessage(dataPackage);
        }
        else if (!this.isSmartValueSubscription(name)) {
            // If it is a regular function call, queue it up to send when the other side comes online. SmartValues will happen automatically
            this.queuedCalls[name] = this.queuedCalls[name] || [];
            this.queuedCalls[name].push(dataPackage);
        }
    };
    /**
     * Subscribes to all changes for the SmartValue from the remote's version
     */
    Communicator.prototype.subscribeAcrossCommunicator = function (sv, name, subscribeCallback) {
        if (subscribeCallback) {
            sv.subscribe(subscribeCallback, { callOnSubscribe: false });
        }
        this.registerFunction(Communicator.setValuePrefix + name, function (val) {
            sv.set(val);
        });
    };
    /**
     * Broadcast all changes for the SmartValue to the remote's version
     */
    Communicator.prototype.broadcastAcrossCommunicator = function (sv, name) {
        var _this = this;
        var callback = function (val) {
            _this.updateRemoteSmartValue(name, val);
        };
        if (!this.svFunctions[name]) {
            this.svFunctions[name] = [];
        }
        this.svFunctions[name].push(callback);
        this.trackedSmartValues[name] = sv;
        sv.subscribe(callback);
    };
    Communicator.prototype.updateRemoteSmartValue = function (smartValueName, value) {
        this.callRemoteFunction(Communicator.setValuePrefix + smartValueName, { param: value });
    };
    /**
     * Sends a message to the other side to let them know we are connected for the firstTime
     */
    Communicator.prototype.sendInitializationMessage = function () {
        this.postMessage({ functionKey: Communicator.initializationKey });
    };
    /**
     * Sends a message to the other side to let them know we saw their initialization message
     */
    Communicator.prototype.sendAcknowledgementMessage = function () {
        this.postMessage({ functionKey: Communicator.acknowledgeKey });
    };
    Communicator.prototype.isSmartValueSubscription = function (functionKey) {
        return functionKey.substr(0, Communicator.setValuePrefix.length) === Communicator.setValuePrefix;
    };
    /**
     * Update the dataPackage with the channel, and send it as a JSON string to the MessageHandler
     */
    Communicator.prototype.postMessage = function (dataPackage) {
        // If we specified a channel, then we always send that with the message
        if (this.channel) {
            dataPackage.channel = this.channel;
        }
        try {
            this.messageHandler.sendMessage(JSON.stringify(dataPackage));
        }
        catch (e) {
            if (this.communicatorErrorHandler) {
                this.communicatorErrorHandler(e);
            }
            else {
                throw e;
            }
        }
    };
    return Communicator;
}());
Communicator.initializationKey = "INITIALIZATION-K3Y";
Communicator.acknowledgeKey = "ACKNOWLEDGE-K3Y";
Communicator.registrationKey = "REGISTER-FUNCTION-K3Y";
Communicator.setValuePrefix = "SETVALUE-";
Communicator.callbackPostfix = "-CALLBACK";
exports.Communicator = Communicator;

},{}],19:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var messageHandler_1 = require("./messageHandler");
// Communication manager class for handling message passing between windows
var IFrameMessageHandler = (function (_super) {
    __extends(IFrameMessageHandler, _super);
    function IFrameMessageHandler(getOtherWindow) {
        var _this = _super.call(this) || this;
        _this.getOtherWindow = getOtherWindow;
        _this.initMessageHandler();
        window.addEventListener("message", _this.messageHandler);
        return _this;
    }
    IFrameMessageHandler.prototype.initMessageHandler = function () {
        var _this = this;
        this.messageHandler = function (event) {
            _this.onMessageReceived(event.data);
            // Since the message was correctly handled, we don't want any pre-established handlers getting called
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            else {
                event.cancelBubble = true;
            }
        };
    };
    IFrameMessageHandler.prototype.sendMessage = function (dataString) {
        var otherWindow = this.getOtherWindow();
        otherWindow.postMessage(dataString, "*");
    };
    IFrameMessageHandler.prototype.tearDown = function () {
        window.removeEventListener("message", this.messageHandler);
    };
    return IFrameMessageHandler;
}(messageHandler_1.MessageHandler));
exports.IFrameMessageHandler = IFrameMessageHandler;

},{"./messageHandler":20}],20:[function(require,module,exports){
"use strict";
var MessageHandler = (function () {
    function MessageHandler() {
    }
    /*
     * Event handler that the Communicator uses to know when this MessageHandler received a message
     */
    MessageHandler.prototype.onMessageReceived = function (data) {
        // This method is overwritten by the parent Communicator
        // Should be called when this MessageHandler receives a message
    };
    return MessageHandler;
}());
exports.MessageHandler = MessageHandler;

},{}],21:[function(require,module,exports){
"use strict";
var SmartValue = (function () {
    function SmartValue(t) {
        this.subscriptions = [];
        this.t = t;
    }
    SmartValue.prototype.subscribe = function (func, options) {
        if (options === void 0) { options = {}; }
        // Setup the defaults if they weren't specified
        if (options.times === undefined) {
            options.times = Infinity;
        }
        if (options.callOnSubscribe === undefined) {
            options.callOnSubscribe = true;
        }
        if (options.callOnSubscribe) {
            func(this.t);
        }
        if (options.times > 0) {
            this.subscriptions.push({ func: func, times: options.times });
        }
    };
    SmartValue.prototype.unsubscribe = function (func) {
        for (var i = 0; i < this.subscriptions.length; i++) {
            if (func === this.subscriptions[i].func) {
                this.subscriptions.splice(i, 1);
                return;
            }
        }
    };
    SmartValue.prototype.set = function (t) {
        if (this.t !== t) {
            this.t = t;
            this.notifySubscribers();
        }
        return this;
    };
    SmartValue.prototype.get = function () {
        return this.t;
    };
    SmartValue.prototype.forceUpdate = function () {
        this.notifySubscribers();
    };
    SmartValue.prototype.equals = function (t) {
        return this.t === t;
    };
    SmartValue.prototype.toString = function () {
        return !this.t ? "undefined" : this.t.toString();
    };
    SmartValue.prototype.notifySubscribers = function () {
        var numSubscribers = this.subscriptions.length;
        for (var i = 0; i < numSubscribers; i++) {
            this.subscriptions[i].times--;
            this.subscriptions[i].func(this.t);
            var noMoreExecutions = this.subscriptions[i] && this.subscriptions[i].times === 0;
            if (noMoreExecutions) {
                this.subscriptions.splice(i, 1);
            }
            // We check for undefined as the callback could have called unsubscribe
            if (!this.subscriptions[i] || noMoreExecutions) {
                numSubscribers--;
                i--;
            }
        }
    };
    // Subscribe to multiple SVs.
    // Example:
    // var appleColor: SmartValue<string>;
    // var appleCount: SmartValue<number>;
    // Subscribe( [appleColor, appleCount], function(color, count) { /*Do something*/});
    SmartValue.subscribe = function (values, func) {
        for (var i = 0; i < values.length; i++) {
            values[i].subscribe(function () {
                var currValues = [];
                for (var j = 0; j < values.length; j++) {
                    currValues.push(values[j].get());
                }
                // ReSharper disable once SuspiciousThisUsage
                func.apply(this, currValues);
            });
        }
    };
    return SmartValue;
}());
exports.SmartValue = SmartValue;

},{}],22:[function(require,module,exports){
"use strict";
var Constants;
(function (Constants) {
    var Classes;
    (function (Classes) {
        // animators
        Classes.heightAnimator = "height-animator";
        Classes.panelAnimator = "panel-animator";
        Classes.clearfix = "clearfix";
        // changeLogPanel
        Classes.change = "change";
        Classes.changes = "changes";
        Classes.changeBody = "change-body";
        Classes.changeDescription = "change-description";
        Classes.changeImage = "change-image";
        Classes.changeTitle = "change-title";
        // checkbox
        Classes.checkboxCheck = "checkboxCheck";
        // textArea input control
        Classes.textAreaInput = "textAreaInput";
        Classes.textAreaInputMirror = "textAreaInputMirror";
        // popover
        Classes.popover = "popover";
        Classes.popoverArrow = "popover-arrow";
        // previewViewer
        Classes.deleteHighlightButton = "delete-highlight";
        Classes.highlightable = "highlightable";
        Classes.highlighted = "highlighted";
        Classes.regionSelection = "region-selection";
        Classes.regionSelectionImage = "region-selection-image";
        Classes.regionSelectionRemoveButton = "region-selection-remove-button";
        // pdfPreviewViewer
        Classes.attachmentOverlay = "attachment-overlay";
        Classes.centeredInCanvas = "centered-in-canvas";
        Classes.overlay = "overlay";
        Classes.overlayHidden = "overlay-hidden";
        Classes.overlayNumber = "overlay-number";
        Classes.pdfPreviewImage = "pdf-preview-image";
        Classes.pdfPreviewImageCanvas = "pdf-preview-image-canvas";
        Classes.unselected = "unselected";
        Classes.localPdfPanelTitle = "local-pdf-panel-title";
        Classes.localPdfPanelSubtitle = "local-pdf-panel-subtitle";
        // radioButton
        Classes.radioIndicatorFill = "radio-indicator-fill";
        // spriteAnimation
        Classes.spinner = "spinner";
        // Accessibility 
        Classes.srOnly = "sr-only";
        // tooltip
        Classes.tooltip = "tooltip";
        // rotatingMessageSpriteAnimation
        Classes.centeredInPreview = "centered-in-preview";
    })(Classes = Constants.Classes || (Constants.Classes = {}));
    var Cookies;
    (function (Cookies) {
        Cookies.clipperInfo = "ClipperInfo";
    })(Cookies = Constants.Cookies || (Constants.Cookies = {}));
    var Extension;
    (function (Extension) {
        var NotificationIds;
        (function (NotificationIds) {
            NotificationIds.conflictingExtension = "conflictingExtension";
        })(NotificationIds = Extension.NotificationIds || (Extension.NotificationIds = {}));
    })(Extension = Constants.Extension || (Constants.Extension = {}));
    var Ids;
    (function (Ids) {
        // annotationInput
        Ids.annotationContainer = "annotationContainer";
        Ids.annotationField = "annotationField";
        Ids.annotationFieldMirror = "annotationFieldMirror";
        Ids.annotationPlaceholder = "annotationPlaceholder";
        // bookmarkPreview
        Ids.bookmarkThumbnail = "bookmarkThumbnail";
        Ids.bookmarkPreviewContentContainer = "bookmarkPreviewContentContainer";
        Ids.bookmarkPreviewInnerContainer = "bookmarkPreviewInnerContainer";
        // clippingPanel
        Ids.clipperApiProgressContainer = "clipperApiProgressContainer";
        // clippingPanel
        Ids.clipProgressDelayedMessage = "clipProgressDelayedMessage";
        Ids.clipProgressIndicatorMessage = "clipProgressIndicatorMessage";
        // dialogPanel
        Ids.dialogBackButton = "dialogBackButton";
        Ids.dialogButtonContainer = "dialogButtonContainer";
        Ids.dialogDebugMessageContainer = "dialogDebugMessageContainer";
        Ids.dialogMessageContainer = "dialogMessageContainer";
        Ids.dialogContentContainer = "dialogContentContainer";
        Ids.dialogMessage = "dialogMessage";
        Ids.dialogSignOutButton = "dialogSignoutButton";
        Ids.dialogTryAgainButton = "dialogTryAgainButton";
        // editorPreviewComponentBase
        Ids.highlightablePreviewBody = "highlightablePreviewBody";
        // failurePanel
        Ids.apiErrorMessage = "apiErrorMessage";
        Ids.backToHomeButton = "backToHomeButton";
        Ids.clipperFailureContainer = "clipperFailureContainer";
        Ids.refreshPageButton = "refreshPageButton";
        Ids.tryAgainButton = "tryAgainButton";
        // footer
        Ids.clipperFooterContainer = "clipperFooterContainer";
        Ids.currentUserControl = "currentUserControl";
        Ids.currentUserDetails = "currentUserDetails";
        Ids.currentUserEmail = "currentUserEmail";
        Ids.currentUserId = "currentUserId";
        Ids.currentUserName = "currentUserName";
        Ids.feedbackButton = "feedbackButton";
        Ids.feedbackImage = "feedbackImage";
        Ids.signOutButton = "signOutButton";
        Ids.userDropdownArrow = "userDropdownArrow";
        Ids.userSettingsContainer = "userSettingsContainer";
        Ids.feedbackLabel = "feedbackLabel";
        Ids.footerButtonsContainer = "footerButtonsContainer";
        // loadingPanel
        Ids.clipperLoadingContainer = "clipperLoadingContainer";
        // mainController
        Ids.closeButton = "closeButton";
        Ids.closeButtonContainer = "closeButtonContainer";
        Ids.mainController = "mainController";
        // OneNotePicker
        Ids.saveToLocationContainer = "saveToLocationContainer";
        // optionsPanel
        Ids.clipButton = "clipButton";
        Ids.clipButtonContainer = "clipButtonContainer";
        Ids.optionLabel = "optionLabel";
        // previewViewerPdfHeader
        Ids.radioAllPagesLabel = "radioAllPagesLabel";
        Ids.radioPageRangeLabel = "radioPageRangeLabel";
        Ids.rangeInput = "rangeInput";
        // previewViewer
        Ids.previewBody = "previewBody";
        Ids.previewContentContainer = "previewContentContainer";
        Ids.previewHeader = "previewHeader";
        Ids.previewHeaderContainer = "previewHeaderContainer";
        Ids.previewHeaderInput = "previewHeaderInput";
        Ids.previewHeaderInputMirror = "previewHeaderInputMirror";
        Ids.previewTitleContainer = "previewTitleContainer";
        Ids.previewSubtitleContainer = "previewSubtitleContainer";
        Ids.previewInnerContainer = "previewInnerContainer";
        Ids.previewOptionsContainer = "previewOptionsContainer";
        Ids.previewInnerWrapper = "previewInnerWrapper";
        Ids.previewOuterContainer = "previewOuterContainer";
        Ids.previewUrlContainer = "previewUrlContainer";
        Ids.previewNotesContainer = "previewNotesContainer";
        // previewViewerFullPageHeader
        Ids.fullPageControl = "fullPageControl";
        Ids.fullPageHeaderTitle = "fullPageHeaderTitle";
        // previewViewerPdfHeader
        Ids.localPdfFileTitle = "localPdfFileTitle";
        Ids.pdfControl = "pdfControl";
        Ids.pdfHeaderTitle = "pdfHeaderTitle";
        Ids.pageRangeControl = "pageRangeControl";
        // pdfClipOptions
        Ids.checkboxToDistributePages = "checkboxToDistributePages";
        Ids.pdfIsTooLargeToAttachIndicator = "pdfIsTooLargeToAttachIndicator";
        Ids.checkboxToAttachPdf = "checkboxToAttachPdf";
        Ids.moreClipOptions = "moreClipOptions";
        // previewViewerRegionHeader
        Ids.addAnotherRegionButton = "addAnotherRegionButton";
        Ids.addRegionControl = "addRegionControl";
        // previewViewerRegionTitleOnlyHeader
        Ids.regionControl = "regionControl";
        Ids.regionHeaderTitle = "regionHeaderTitle";
        // previewViewerAugmentationHeader
        Ids.decrementFontSize = "decrementFontSize";
        Ids.fontSizeControl = "fontSizeControl";
        Ids.highlightButton = "highlightButton";
        Ids.highlightControl = "highlightControl";
        Ids.incrementFontSize = "incrementFontSize";
        Ids.serifControl = "serifControl";
        Ids.sansSerif = "sansSerif";
        Ids.serif = "serif";
        // previewViewerBookmarkHeader
        Ids.bookmarkControl = "bookmarkControl";
        Ids.bookmarkHeaderTitle = "bookmarkHeaderTitle";
        // ratingsPrompt
        Ids.ratingsButtonFeedbackNo = "ratingsButtonFeedbackNo";
        Ids.ratingsButtonFeedbackYes = "ratingsButtonFeedbackYes";
        Ids.ratingsButtonInitNo = "ratingsButtonInitNo";
        Ids.ratingsButtonInitYes = "ratingsButtonInitYes";
        Ids.ratingsButtonRateNo = "ratingsButtonRateNo";
        Ids.ratingsButtonRateYes = "ratingsButtonRateYes";
        Ids.ratingsPromptContainer = "ratingsPromptContainer";
        // regionSelectingPanel
        Ids.regionInstructionsContainer = "regionInstructionsContainer";
        Ids.regionClipCancelButton = "regionClipCancelButton";
        // regionSelector
        Ids.innerFrame = "innerFrame";
        Ids.outerFrame = "outerFrame";
        Ids.regionSelectorContainer = "regionSelectorContainer";
        // rotatingMessageSpriteAnimation
        Ids.spinnerText = "spinnerText";
        // sectionPicker
        Ids.locationPickerContainer = "locationPickerContainer";
        // signInPanel
        Ids.signInButtonMsa = "signInButtonMsa";
        Ids.signInButtonOrgId = "signInButtonOrgId";
        Ids.signInContainer = "signInContainer";
        Ids.signInErrorCookieInformation = "signInErrorCookieInformation";
        Ids.signInErrorDebugInformation = "signInErrorDebugInformation";
        Ids.signInErrorDebugInformationDescription = "signInErrorDebugInformationDescription";
        Ids.signInErrorDebugInformationContainer = "signInErrorDebugInformationContainer";
        Ids.signInErrorDebugInformationList = "signInErrorDebugInformationList";
        Ids.signInErrorDescription = "signInErrorDescription";
        Ids.signInErrorDescriptionContainer = "signInErrorDescriptionContainer";
        Ids.signInErrorMoreInformation = "signInErrorMoreInformation";
        Ids.signInLogo = "signInLogo";
        Ids.signInMessageLabelContainer = "signInMessageLabelContainer";
        Ids.signInText = "signInText";
        Ids.signInToggleErrorDropdownArrow = "signInToggleErrorDropdownArrow";
        Ids.signInToggleErrorInformationText = "signInToggleErrorInformationText";
        // successPanel
        Ids.clipperSuccessContainer = "clipperSuccessContainer";
        Ids.launchOneNoteButton = "launchOneNoteButton";
        // tooltipRenderer
        Ids.pageNavAnimatedTooltip = "pageNavAnimatedTooltip";
        // unsupportedBrowser
        Ids.unsupportedBrowserContainer = "unsupportedBrowserContainer";
        Ids.unsupportedBrowserPanel = "unsupportedBrowserPanel";
        // whatsNewPanel
        Ids.changeLogSubPanel = "changeLogSubPanel";
        Ids.checkOutWhatsNewButton = "checkOutWhatsNewButton";
        Ids.proceedToWebClipperButton = "proceedToWebClipperButton";
        Ids.whatsNewTitleSubPanel = "whatsNewTitleSubPanel";
        Ids.clipperRootScript = "oneNoteCaptureRootScript";
        Ids.clipperUiFrame = "oneNoteWebClipper";
        Ids.clipperPageNavFrame = "oneNoteWebClipperPageNav";
        Ids.clipperExtFrame = "oneNoteWebClipperExtension";
        // tooltips
        Ids.brandingContainer = "brandingContainer";
    })(Ids = Constants.Ids || (Constants.Ids = {}));
    var HeaderValues;
    (function (HeaderValues) {
        HeaderValues.accept = "Accept";
        HeaderValues.appIdKey = "MS-Int-AppId";
        HeaderValues.correlationId = "X-CorrelationId";
        HeaderValues.noAuthKey = "X-NoAuth";
        HeaderValues.userSessionIdKey = "X-UserSessionId";
    })(HeaderValues = Constants.HeaderValues || (Constants.HeaderValues = {}));
    var CommunicationChannels;
    (function (CommunicationChannels) {
        // Debug Logging
        CommunicationChannels.debugLoggingInjectedAndExtension = "DEBUGLOGGINGINJECTED_AND_EXTENSION";
        // Web Clipper
        CommunicationChannels.extensionAndUi = "EXTENSION_AND_UI";
        CommunicationChannels.injectedAndUi = "INJECTED_AND_UI";
        CommunicationChannels.injectedAndExtension = "INJECTED_AND_EXTENSION";
        // What's New
        CommunicationChannels.extensionAndPageNavUi = "EXTENSION_AND_PAGENAVUI";
        CommunicationChannels.pageNavInjectedAndPageNavUi = "PAGENAVINJECTED_AND_PAGENAVUI";
        CommunicationChannels.pageNavInjectedAndExtension = "PAGENAVINJECTED_AND_EXTENSION";
    })(CommunicationChannels = Constants.CommunicationChannels || (Constants.CommunicationChannels = {}));
    var FunctionKeys;
    (function (FunctionKeys) {
        FunctionKeys.clipperStrings = "CLIPPER_STRINGS";
        FunctionKeys.clipperStringsFrontLoaded = "CLIPPER_STRINGS_FRONT_LOADED";
        FunctionKeys.closePageNavTooltip = "CLOSE_PAGE_NAV_TOOLTIP";
        FunctionKeys.createHiddenIFrame = "CREATE_HIDDEN_IFRAME";
        FunctionKeys.ensureFreshUserBeforeClip = "ENSURE_FRESH_USER_BEFORE_CLIP";
        FunctionKeys.escHandler = "ESC_HANDLER";
        FunctionKeys.getInitialUser = "GET_INITIAL_USER";
        FunctionKeys.getPageNavTooltipProps = "GET_PAGE_NAV_TOOLTIP_PROPS";
        FunctionKeys.getStorageValue = "GET_STORAGE_VALUE";
        FunctionKeys.getMultipleStorageValues = "GET_MULTIPLE_STORAGE_VALUES";
        FunctionKeys.getTooltipToRenderInPageNav = "GET_TOOLTIP_TO_RENDER_IN_PAGE_NAV";
        FunctionKeys.hideUi = "HIDE_UI";
        FunctionKeys.invokeClipper = "INVOKE_CLIPPER";
        FunctionKeys.invokeClipperFromPageNav = "INVOKE_CLIPPER_FROM_PAGE_NAV";
        FunctionKeys.invokeDebugLogging = "INVOKE_DEBUG_LOGGING";
        FunctionKeys.invokePageNav = "INVOKE_PAGE_NAV";
        FunctionKeys.extensionNotAllowedToAccessLocalFiles = "EXTENSION_NOT_ALLOWED_TO_ACCESS_LOCAL_FILES";
        FunctionKeys.noOpTracker = "NO_OP_TRACKER";
        FunctionKeys.onSpaNavigate = "ON_SPA_NAVIGATE";
        FunctionKeys.refreshPage = "REFRESH_PAGE";
        FunctionKeys.showRefreshClipperMessage = "SHOW_REFRESH_CLIPPER_MESSAGE";
        FunctionKeys.setInjectOptions = "SET_INJECT_OPTIONS";
        FunctionKeys.setInvokeOptions = "SET_INVOKE_OPTIONS";
        FunctionKeys.setStorageValue = "SET_STORAGE_VALUE";
        FunctionKeys.signInUser = "SIGN_IN_USER";
        FunctionKeys.signOutUser = "SIGN_OUT_USER";
        FunctionKeys.tabToLowestIndexedElement = "TAB_TO_LOWEST_INDEXED_ELEMENT";
        FunctionKeys.takeTabScreenshot = "TAKE_TAB_SCREENSHOT";
        FunctionKeys.telemetry = "TELEMETRY";
        FunctionKeys.toggleClipper = "TOGGLE_CLIPPER";
        FunctionKeys.unloadHandler = "UNLOAD_HANDLER";
        FunctionKeys.updateFrameHeight = "UPDATE_FRAME_HEIGHT";
        FunctionKeys.updatePageInfoIfUrlChanged = "UPDATE_PAGE_INFO_IF_URL_CHANGED";
    })(FunctionKeys = Constants.FunctionKeys || (Constants.FunctionKeys = {}));
    var KeyCodes;
    (function (KeyCodes) {
        // event.which is deprecated -.-
        KeyCodes.tab = 9;
        KeyCodes.enter = 13;
        KeyCodes.esc = 27;
        KeyCodes.c = 67;
        KeyCodes.down = 40;
        KeyCodes.up = 38;
        KeyCodes.left = 37;
        KeyCodes.right = 39;
        KeyCodes.space = 32;
        KeyCodes.home = 36;
        KeyCodes.end = 35;
    })(KeyCodes = Constants.KeyCodes || (Constants.KeyCodes = {}));
    var StringKeyCodes;
    (function (StringKeyCodes) {
        StringKeyCodes.c = "KeyC";
    })(StringKeyCodes = Constants.StringKeyCodes || (Constants.StringKeyCodes = {}));
    var SmartValueKeys;
    (function (SmartValueKeys) {
        SmartValueKeys.clientInfo = "CLIENT_INFO";
        SmartValueKeys.isFullScreen = "IS_FULL_SCREEN";
        SmartValueKeys.pageInfo = "PAGE_INFO";
        SmartValueKeys.sessionId = "SESSION_ID";
        SmartValueKeys.user = "USER";
    })(SmartValueKeys = Constants.SmartValueKeys || (Constants.SmartValueKeys = {}));
    var Styles;
    (function (Styles) {
        Styles.sectionPickerContainerHeight = 280;
        Styles.clipperUiWidth = 322;
        Styles.clipperUiTopRightOffset = 20;
        Styles.clipperUiDropShadowBuffer = 7;
        Styles.clipperUiInnerPadding = 30;
        var Colors;
        (function (Colors) {
            Colors.oneNoteHighlightColor = "#fefe56";
        })(Colors = Styles.Colors || (Styles.Colors = {}));
    })(Styles = Constants.Styles || (Constants.Styles = {}));
    var Urls;
    (function (Urls) {
        Urls.serviceDomain = "https://www.onenote.com";
        Urls.augmentationApiUrl = Urls.serviceDomain + "/onaugmentation/clipperextract/v1.0/";
        Urls.changelogUrl = Urls.serviceDomain + "/whatsnext/webclipper";
        Urls.clipperFeedbackUrl = Urls.serviceDomain + "/feedback";
        Urls.clipperInstallPageUrl = Urls.serviceDomain + "/clipper/installed";
        Urls.fullPageScreenshotUrl = Urls.serviceDomain + "/onaugmentation/clipperDomEnhancer/v1.0/";
        Urls.localizedStringsUrlBase = Urls.serviceDomain + "/strings?ids=WebClipper.";
        Urls.msaDomain = "https://login.live.com";
        Urls.orgIdDomain = "https://login.microsoftonline.com";
        var Authentication;
        (function (Authentication) {
            Authentication.authRedirectUrl = Urls.serviceDomain + "/webclipper/auth";
            Authentication.signInUrl = Urls.serviceDomain + "/webclipper/signin";
            Authentication.signOutUrl = Urls.serviceDomain + "/webclipper/signout";
            Authentication.userInformationUrl = Urls.serviceDomain + "/webclipper/userinfo";
        })(Authentication = Urls.Authentication || (Urls.Authentication = {}));
        var QueryParams;
        (function (QueryParams) {
            QueryParams.authType = "authType";
            QueryParams.category = "category";
            QueryParams.changelogLocale = "omkt";
            QueryParams.channel = "channel";
            QueryParams.clientType = "clientType";
            QueryParams.clipperId = "clipperId";
            QueryParams.clipperVersion = "clipperVersion";
            QueryParams.correlationId = "correlationId";
            QueryParams.error = "error";
            QueryParams.errorDescription = "error_?description";
            QueryParams.event = "event";
            QueryParams.eventName = "eventName";
            QueryParams.failureId = "failureId";
            QueryParams.failureInfo = "failureInfo";
            QueryParams.failureType = "failureType";
            QueryParams.inlineInstall = "inlineInstall";
            QueryParams.label = "label";
            QueryParams.noOpType = "noOpType";
            QueryParams.stackTrace = "stackTrace";
            QueryParams.timeoutInMs = "timeoutInMs";
            QueryParams.url = "url";
            QueryParams.userSessionId = "userSessionId";
            QueryParams.wdFromClipper = "wdfromclipper"; // This naming convention is standard in OneNote Online
        })(QueryParams = Urls.QueryParams || (Urls.QueryParams = {}));
    })(Urls = Constants.Urls || (Constants.Urls = {}));
    var LogCategories;
    (function (LogCategories) {
        LogCategories.oneNoteClipperUsage = "OneNoteClipperUsage";
    })(LogCategories = Constants.LogCategories || (Constants.LogCategories = {}));
    var Settings;
    (function (Settings) {
        Settings.fontSizeStep = 2;
        Settings.maxClipSuccessForRatingsPrompt = 12;
        Settings.maximumJSTimeValue = 1000 * 60 * 60 * 24 * 100000000; // 100M days in milliseconds, http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
        Settings.maximumFontSize = 72;
        Settings.maximumNumberOfTimesToShowTooltips = 3;
        Settings.maximumMimeSizeLimit = 24900000;
        Settings.minClipSuccessForRatingsPrompt = 4;
        Settings.minimumFontSize = 8;
        Settings.minTimeBetweenBadRatings = 1000 * 60 * 60 * 24 * 7 * 10; // 10 weeks
        Settings.noOpTrackerTimeoutDuration = 20 * 1000; // 20 seconds
        Settings.numRetriesPerPatchRequest = 3;
        Settings.pdfCheckCreatePageInterval = 2000; // 2 seconds
        Settings.pdfClippingMessageDelay = 5000; // 5 seconds
        Settings.pdfExtraPageLoadEachSide = 1;
        Settings.pdfInitialPageLoadCount = 3;
        Settings.timeBetweenDifferentTooltips = 1000 * 60 * 60 * 24 * 7 * 1; // 1 week
        Settings.timeBetweenSameTooltip = 1000 * 60 * 60 * 24 * 7 * 3; // 3 weeks
        Settings.timeBetweenTooltips = 1000 * 60 * 60 * 24 * 7 * 3; // 21 days
        Settings.timeUntilPdfPageNumbersFadeOutAfterScroll = 1000; // 1 second
    })(Settings = Constants.Settings || (Constants.Settings = {}));
    var CustomHtmlAttributes;
    (function (CustomHtmlAttributes) {
        CustomHtmlAttributes.setNameForArrowKeyNav = "setnameforarrowkeynav";
    })(CustomHtmlAttributes = Constants.CustomHtmlAttributes || (Constants.CustomHtmlAttributes = {}));
    var AriaSet;
    (function (AriaSet) {
        AriaSet.modeButtonSet = "ariaModeButtonSet";
        AriaSet.pdfPageSelection = "pdfPageSelection";
        AriaSet.serifGroupSet = "serifGroupSet";
    })(AriaSet = Constants.AriaSet || (Constants.AriaSet = {}));
})(Constants = exports.Constants || (exports.Constants = {}));

},{}],23:[function(require,module,exports){
"use strict";
var ExtensionUtils;
(function (ExtensionUtils) {
    /*
     * Returns the relative path to the images directory.
     */
    function getImageResourceUrl(imageName) {
        // Since Chromebook has case-sensitive urls, we always go with lowercase image names.
        // See the use of "lowerCasePathName" in gulpfile.js where the images names are lower-cased
        // when copied)
        return ("images/" + imageName).toLowerCase();
    }
    ExtensionUtils.getImageResourceUrl = getImageResourceUrl;
})(ExtensionUtils = exports.ExtensionUtils || (exports.ExtensionUtils = {}));

},{}],24:[function(require,module,exports){
"use strict";
var InvokeSource;
(function (InvokeSource) {
    InvokeSource[InvokeSource["Bookmarklet"] = 0] = "Bookmarklet";
    InvokeSource[InvokeSource["ContextMenu"] = 1] = "ContextMenu";
    InvokeSource[InvokeSource["ExtensionButton"] = 2] = "ExtensionButton";
    InvokeSource[InvokeSource["WhatsNewTooltip"] = 3] = "WhatsNewTooltip";
    InvokeSource[InvokeSource["PdfTooltip"] = 4] = "PdfTooltip";
    InvokeSource[InvokeSource["ProductTooltip"] = 5] = "ProductTooltip";
    InvokeSource[InvokeSource["RecipeTooltip"] = 6] = "RecipeTooltip";
    InvokeSource[InvokeSource["VideoTooltip"] = 7] = "VideoTooltip";
})(InvokeSource = exports.InvokeSource || (exports.InvokeSource = {}));

},{}],25:[function(require,module,exports){
"use strict";
var Localization;
(function (Localization) {
    var FontFamily;
    (function (FontFamily) {
        FontFamily[FontFamily["Regular"] = 0] = "Regular";
        FontFamily[FontFamily["Bold"] = 1] = "Bold";
        FontFamily[FontFamily["Light"] = 2] = "Light";
        FontFamily[FontFamily["Semibold"] = 3] = "Semibold";
        FontFamily[FontFamily["Semilight"] = 4] = "Semilight";
    })(FontFamily = Localization.FontFamily || (Localization.FontFamily = {}));
    var localizedStrings;
    var formattedFontFamilies = {};
    // The fallback for when we are unable to fetch locstrings from our server
    var backupStrings = require("../../strings.json");
    /*
     * Gets the matching localized string, or the fallback (unlocalized) string if
     * unavailable.
     */
    function getLocalizedString(stringId) {
        if (!stringId) {
            throw new Error("stringId must be a non-empty string, but was: " + stringId);
        }
        if (localizedStrings) {
            var localResult = localizedStrings[stringId];
            if (localResult) {
                return localResult;
            }
        }
        var backupResult = backupStrings[stringId];
        if (backupResult) {
            return backupResult;
        }
        throw new Error("getLocalizedString could not find a localized or fallback string: " + stringId);
    }
    Localization.getLocalizedString = getLocalizedString;
    function setLocalizedStrings(localizedStringsAsJson) {
        localizedStrings = localizedStringsAsJson;
    }
    Localization.setLocalizedStrings = setLocalizedStrings;
    function getFontFamilyAsStyle(family) {
        return "font-family: " + getFontFamily(family) + ";";
    }
    Localization.getFontFamilyAsStyle = getFontFamilyAsStyle;
    function getFontFamily(family) {
        // Check cache first
        if (formattedFontFamilies[family]) {
            return formattedFontFamilies[family];
        }
        var stringId = "WebClipper.FontFamily." + FontFamily[family].toString();
        var fontFamily = getLocalizedString(stringId);
        formattedFontFamilies[family] = formatFontFamily(fontFamily);
        return formattedFontFamilies[family];
    }
    Localization.getFontFamily = getFontFamily;
    /*
     * If we want to set font families through JavaScript, it uses a specific
     * format. This helper function returns the formatted font family input.
     */
    function formatFontFamily(fontFamily) {
        if (!fontFamily) {
            return "";
        }
        var splits = fontFamily.split(",");
        for (var i = 0; i < splits.length; i++) {
            splits[i] = splits[i].trim();
            if (splits[i].length > 0 && splits[i].indexOf(" ") >= 0 && splits[i][0] !== "'" && splits[i][splits.length - 1] !== "'") {
                splits[i] = "'" + splits[i] + "'";
            }
        }
        return splits.join(",");
    }
    Localization.formatFontFamily = formatFontFamily;
})(Localization = exports.Localization || (exports.Localization = {}));

},{"../../strings.json":44}],26:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var constants_1 = require("../constants");
var Log = require("./log");
var logger_1 = require("./logger");
var CommunicatorLoggerPure = (function (_super) {
    __extends(CommunicatorLoggerPure, _super);
    function CommunicatorLoggerPure(communicator) {
        var _this = _super.call(this) || this;
        _this.communicator = communicator;
        return _this;
    }
    CommunicatorLoggerPure.prototype.logEvent = function (event) {
        if (!event.timerWasStopped()) {
            event.stopTimer();
        }
        // We need to send the event category as well so that the other side knows which one it is
        this.sendDataPackage(Log.LogMethods.LogEvent, [event.getEventCategory(), event.getEventData()]);
    };
    CommunicatorLoggerPure.prototype.logFailure = function (label, failureType, failureInfo, id) {
        this.sendDataPackage(Log.LogMethods.LogFailure, arguments);
    };
    CommunicatorLoggerPure.prototype.logUserFunnel = function (label) {
        this.sendDataPackage(Log.LogMethods.LogFunnel, arguments);
    };
    CommunicatorLoggerPure.prototype.logSessionStart = function () {
        this.sendDataPackage(Log.LogMethods.LogSessionStart, arguments);
    };
    CommunicatorLoggerPure.prototype.logSessionEnd = function (endTrigger) {
        this.sendDataPackage(Log.LogMethods.LogSessionEnd, arguments);
    };
    CommunicatorLoggerPure.prototype.logTrace = function (label, level, message) {
        if (message) {
            this.sendDataPackage(Log.LogMethods.LogTrace, [label, level, message]);
        }
        else {
            this.sendDataPackage(Log.LogMethods.LogTrace, [label, level]);
        }
    };
    CommunicatorLoggerPure.prototype.pushToStream = function (label, value) {
        this.sendDataPackage(Log.LogMethods.PushToStream, arguments);
    };
    CommunicatorLoggerPure.prototype.logClickEvent = function (clickId) {
        this.sendDataPackage(Log.LogMethods.LogClickEvent, arguments);
    };
    CommunicatorLoggerPure.prototype.setContextProperty = function (key, value) {
        this.sendDataPackage(Log.LogMethods.SetContextProperty, arguments);
    };
    CommunicatorLoggerPure.prototype.sendDataPackage = function (methodName, args) {
        var data = {
            methodName: methodName,
            methodArgs: Object.keys(args).map(function (key) { return args[key]; })
        };
        this.communicator.callRemoteFunction(constants_1.Constants.FunctionKeys.telemetry, { param: data });
    };
    return CommunicatorLoggerPure;
}(logger_1.Logger));
exports.CommunicatorLoggerPure = CommunicatorLoggerPure;

},{"../constants":22,"./log":27,"./logger":28}],27:[function(require,module,exports){
"use strict";
var event_1 = require("./submodules/event");
var logMethods_1 = require("./submodules/logMethods");
exports.contextPropertyNameRegex = /^[a-zA-Z0-9](([a-zA-Z0-9|_]){0,98}[a-zA-Z0-9])?$/;
exports.enableConsoleLogging = "enable_console_logging";
exports.reportData = "ReportData";
exports.unknownValue = "unknown";
function parseAndLogDataPackage(data, logger) {
    switch (data.methodName) {
        case logMethods_1.LogMethods.LogEvent:
            var eventCategory = data.methodArgs[0];
            var eventData = data.methodArgs[1];
            logger.logEvent.apply(logger, [event_1.Event.createEvent(eventCategory, eventData)]);
            break;
        case logMethods_1.LogMethods.LogFailure:
            logger.logFailure.apply(logger, data.methodArgs);
            break;
        case logMethods_1.LogMethods.PushToStream:
            logger.pushToStream.apply(logger, data.methodArgs);
            break;
        case logMethods_1.LogMethods.LogFunnel:
            logger.logUserFunnel.apply(logger, data.methodArgs);
            break;
        case logMethods_1.LogMethods.LogSessionStart:
            logger.logSessionStart.apply(logger, data.methodArgs);
            break;
        case logMethods_1.LogMethods.LogSessionEnd:
            logger.logSessionEnd.apply(logger, data.methodArgs);
            break;
        case logMethods_1.LogMethods.LogClickEvent:
            logger.logClickEvent.apply(logger, data.methodArgs);
            break;
        case logMethods_1.LogMethods.SetContextProperty:
            logger.setContextProperty.apply(logger, data.methodArgs);
            break;
        case logMethods_1.LogMethods.LogTrace:
        /* falls through */
        default:
            logger.logTrace.apply(logger, data.methodArgs);
            break;
    }
}
exports.parseAndLogDataPackage = parseAndLogDataPackage;
var click_1 = require("./submodules/click");
exports.Click = click_1.Click;
var context_1 = require("./submodules/context");
exports.Context = context_1.Context;
var errorUtils_1 = require("./submodules/errorUtils");
exports.ErrorUtils = errorUtils_1.ErrorUtils;
var event_2 = require("./submodules/event");
exports.Event = event_2.Event;
var failure_1 = require("./submodules/failure");
exports.Failure = failure_1.Failure;
var funnel_1 = require("./submodules/funnel");
exports.Funnel = funnel_1.Funnel;
var logMethods_2 = require("./submodules/logMethods");
exports.LogMethods = logMethods_2.LogMethods;
var noop_1 = require("./submodules/noop");
exports.NoOp = noop_1.NoOp;
var propertyName_1 = require("./submodules/propertyName");
exports.PropertyName = propertyName_1.PropertyName;
var session_1 = require("./submodules/session");
exports.Session = session_1.Session;
var status_1 = require("./submodules/status");
exports.Status = status_1.Status;
var trace_1 = require("./submodules/trace");
exports.Trace = trace_1.Trace;

},{"./submodules/click":29,"./submodules/context":30,"./submodules/errorUtils":31,"./submodules/event":32,"./submodules/failure":33,"./submodules/funnel":34,"./submodules/logMethods":35,"./submodules/noop":36,"./submodules/propertyName":37,"./submodules/session":38,"./submodules/status":39,"./submodules/trace":40}],28:[function(require,module,exports){
"use strict";
var Log = require("./log");
var Logger = (function () {
    function Logger() {
    }
    Logger.prototype.logJsonParseUnexpected = function (value) {
        this.logFailure(Log.Failure.Label.JsonParse, Log.Failure.Type.Unexpected, undefined /* failureInfo */, value);
    };
    return Logger;
}());
exports.Logger = Logger;

},{"./log":27}],29:[function(require,module,exports){
"use strict";
var Click;
(function (Click) {
    Click.category = "Click";
    var Label;
    (function (Label) {
        Label.regionSelectionRemoveButton = "RegionSelectionRemoveButton";
        Label.sectionComponent = "SectionComponent";
        Label.sectionPickerLocationContainer = "SectionPickerLocationContainer";
    })(Label = Click.Label || (Click.Label = {}));
})(Click = exports.Click || (exports.Click = {}));

},{}],30:[function(require,module,exports){
"use strict";
var Context;
(function (Context) {
    var contextKeyToStringMap = {
        AppInfoId: "AppInfo.Id",
        AppInfoVersion: "AppInfo.Version",
        DeviceInfoId: "DeviceInfo.Id",
        ExtensionLifecycleId: "ExtensionLifecycle.Id",
        SessionId: "Session.Id",
        UserInfoId: "UserInfo.Id",
        UserInfoLanguage: "UserInfo.Language",
        AuthType: "AuthType",
        BrowserLanguage: "BrowserLanguage",
        ClipperType: "ClipperType",
        ContentType: "ContentType",
        FlightInfo: "FlightInfo",
        InPrivateBrowsing: "InPrivateBrowsing",
        InvokeHostname: "InvokeHostname",
        PageLanguage: "PageLanguage"
    };
    var Custom;
    (function (Custom) {
        Custom[Custom["AppInfoId"] = 0] = "AppInfoId";
        Custom[Custom["AppInfoVersion"] = 1] = "AppInfoVersion";
        Custom[Custom["ExtensionLifecycleId"] = 2] = "ExtensionLifecycleId";
        Custom[Custom["DeviceInfoId"] = 3] = "DeviceInfoId";
        Custom[Custom["SessionId"] = 4] = "SessionId";
        Custom[Custom["UserInfoId"] = 5] = "UserInfoId";
        Custom[Custom["UserInfoLanguage"] = 6] = "UserInfoLanguage";
        Custom[Custom["AuthType"] = 7] = "AuthType";
        Custom[Custom["BrowserLanguage"] = 8] = "BrowserLanguage";
        Custom[Custom["ClipperType"] = 9] = "ClipperType";
        Custom[Custom["ContentType"] = 10] = "ContentType";
        Custom[Custom["FlightInfo"] = 11] = "FlightInfo";
        Custom[Custom["InPrivateBrowsing"] = 12] = "InPrivateBrowsing";
        Custom[Custom["InvokeHostname"] = 13] = "InvokeHostname";
        Custom[Custom["PageLanguage"] = 14] = "PageLanguage";
    })(Custom = Context.Custom || (Context.Custom = {}));
    function toString(key) {
        return contextKeyToStringMap[Custom[key]];
    }
    Context.toString = toString;
})(Context = exports.Context || (exports.Context = {}));

},{}],31:[function(require,module,exports){
"use strict";
var clientType_1 = require("../../clientType");
var constants_1 = require("../../constants");
var objectUtils_1 = require("../../objectUtils");
var localization_1 = require("../../localization/localization");
var log_1 = require("../log");
var ErrorUtils;
(function (ErrorUtils) {
    var ErrorPropertyName;
    (function (ErrorPropertyName) {
        ErrorPropertyName[ErrorPropertyName["Error"] = 0] = "Error";
        ErrorPropertyName[ErrorPropertyName["StatusCode"] = 1] = "StatusCode";
        ErrorPropertyName[ErrorPropertyName["Response"] = 2] = "Response";
        ErrorPropertyName[ErrorPropertyName["ResponseHeaders"] = 3] = "ResponseHeaders";
        ErrorPropertyName[ErrorPropertyName["Timeout"] = 4] = "Timeout";
    })(ErrorPropertyName || (ErrorPropertyName = {}));
    function toString(originalError) {
        if (!originalError) {
            return undefined;
        }
        var errorToObject = {};
        errorToObject[ErrorPropertyName[ErrorPropertyName.Error].toLowerCase()] = originalError.error;
        var tryCastError = originalError;
        if (tryCastError && tryCastError.statusCode !== undefined) {
            errorToObject[ErrorPropertyName[ErrorPropertyName.StatusCode].toLowerCase()] = tryCastError.statusCode;
            errorToObject[ErrorPropertyName[ErrorPropertyName.Response].toLowerCase()] = tryCastError.response;
            errorToObject[ErrorPropertyName[ErrorPropertyName.ResponseHeaders].toLowerCase()] = tryCastError.responseHeaders;
            if (tryCastError.timeout !== undefined) {
                errorToObject[ErrorPropertyName[ErrorPropertyName.Timeout].toLowerCase()] = tryCastError.timeout;
            }
        }
        return JSON.stringify(errorToObject);
    }
    ErrorUtils.toString = toString;
    function clone(originalError) {
        if (!originalError) {
            return undefined;
        }
        var tryCastError = originalError;
        if (tryCastError && tryCastError.statusCode !== undefined) {
            if (tryCastError.timeout !== undefined) {
                return { error: tryCastError.error, statusCode: tryCastError.statusCode, response: tryCastError.response, responseHeaders: tryCastError.responseHeaders, timeout: tryCastError.timeout };
            }
            else {
                return { error: tryCastError.error, statusCode: tryCastError.statusCode, response: tryCastError.response, responseHeaders: tryCastError.responseHeaders };
            }
        }
        else {
            return { error: originalError.error };
        }
    }
    ErrorUtils.clone = clone;
    /**
     * Sends a request to the misc logging endpoint with relevant failure data as query parameters
     */
    function sendFailureLogRequest(data) {
        var propsObject = {};
        propsObject[constants_1.Constants.Urls.QueryParams.failureType] = log_1.Failure.Type[data.properties.failureType];
        propsObject[constants_1.Constants.Urls.QueryParams.failureInfo] = ErrorUtils.toString(data.properties.failureInfo);
        propsObject[constants_1.Constants.Urls.QueryParams.stackTrace] = data.properties.stackTrace;
        if (!objectUtils_1.ObjectUtils.isNullOrUndefined(data.properties.failureId)) {
            propsObject[constants_1.Constants.Urls.QueryParams.failureId] = data.properties.failureId;
        }
        var clientInfo = data.clientInfo;
        addDelayedSetValuesOnNoOp(propsObject, clientInfo);
        LogManager.sendMiscLogRequest({
            label: log_1.Failure.Label[data.label],
            category: log_1.Failure.category,
            properties: propsObject
        }, true);
    }
    ErrorUtils.sendFailureLogRequest = sendFailureLogRequest;
    function handleCommunicatorError(channel, e, clientInfo, message) {
        var errorValue;
        if (message) {
            errorValue = JSON.stringify({ message: message, error: e.toString() });
        }
        else {
            errorValue = e.toString();
        }
        ErrorUtils.sendFailureLogRequest({
            label: log_1.Failure.Label.UnhandledExceptionThrown,
            properties: {
                failureType: log_1.Failure.Type.Unexpected,
                failureInfo: { error: errorValue },
                failureId: "Channel " + channel,
                stackTrace: log_1.Failure.getStackTrace(e)
            },
            clientInfo: clientInfo
        });
        throw e;
    }
    ErrorUtils.handleCommunicatorError = handleCommunicatorError;
    /*
    * Sends a request to the misc logging endpoint with noop-relevant data as query parameters
    *	and shows an alert if the relevant property is set.
    */
    function sendNoOpTrackerRequest(props, shouldShowAlert) {
        if (shouldShowAlert === void 0) { shouldShowAlert = false; }
        var propsObject = {};
        propsObject[constants_1.Constants.Urls.QueryParams.channel] = props.channel;
        propsObject[constants_1.Constants.Urls.QueryParams.url] = encodeURIComponent(props.url);
        propsObject[constants_1.Constants.Urls.QueryParams.timeoutInMs] = constants_1.Constants.Settings.noOpTrackerTimeoutDuration.toString();
        var clientInfo = props.clientInfo;
        addDelayedSetValuesOnNoOp(propsObject, clientInfo);
        LogManager.sendMiscLogRequest({
            label: log_1.NoOp.Label[props.label],
            category: log_1.NoOp.category,
            properties: propsObject
        }, true);
        if (shouldShowAlert && window) {
            window.alert(localization_1.Localization.getLocalizedString("WebClipper.Error.NoOpError"));
        }
    }
    ErrorUtils.sendNoOpTrackerRequest = sendNoOpTrackerRequest;
    /*
    * Returns a TimeOut that should be cleared, otherwise sends a request to onenote.com/count
    *	with relevant no-op tracking data
    */
    function setNoOpTrackerRequestTimeout(props, shouldShowAlert) {
        if (shouldShowAlert === void 0) { shouldShowAlert = false; }
        return setTimeout(function () {
            sendNoOpTrackerRequest(props, shouldShowAlert);
        }, constants_1.Constants.Settings.noOpTrackerTimeoutDuration);
    }
    ErrorUtils.setNoOpTrackerRequestTimeout = setNoOpTrackerRequestTimeout;
    /**
     * During a noop scenario, most properties are retrieved at the construction of the NoOpProperties
     * object for setNoOpTrackerRequestTimeout. But some properties could benefit from waiting
     * until after the noop timeout before we attempt to retrieve them (e.g., smart values).
     * This is a helper function for adding these values to the props object on delay.
     */
    function addDelayedSetValuesOnNoOp(props, clientInfo) {
        if (clientInfo) {
            props[constants_1.Constants.Urls.QueryParams.clientType] = objectUtils_1.ObjectUtils.isNullOrUndefined(clientInfo.get()) ? log_1.unknownValue : clientType_1.ClientType[clientInfo.get().clipperType];
            props[constants_1.Constants.Urls.QueryParams.clipperVersion] = objectUtils_1.ObjectUtils.isNullOrUndefined(clientInfo.get()) ? log_1.unknownValue : clientInfo.get().clipperVersion;
            props[constants_1.Constants.Urls.QueryParams.clipperId] = objectUtils_1.ObjectUtils.isNullOrUndefined(clientInfo.get()) ? log_1.unknownValue : clientInfo.get().clipperId;
        }
    }
})(ErrorUtils = exports.ErrorUtils || (exports.ErrorUtils = {}));

},{"../../clientType":1,"../../constants":22,"../../localization/localization":25,"../../objectUtils":41,"../log":27}],32:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var log_1 = require("../log");
var objectUtils_1 = require("../../objectUtils");
var Event;
(function (Event) {
    var Category;
    (function (Category) {
        Category[Category["BaseEvent"] = 0] = "BaseEvent";
        Category[Category["PromiseEvent"] = 1] = "PromiseEvent";
        Category[Category["StreamEvent"] = 2] = "StreamEvent";
    })(Category = Event.Category || (Event.Category = {}));
    var Label;
    (function (Label) {
        Label[Label["AddEmbeddedVideo"] = 0] = "AddEmbeddedVideo";
        Label[Label["AugmentationApiCall"] = 1] = "AugmentationApiCall";
        Label[Label["BookmarkPage"] = 2] = "BookmarkPage";
        Label[Label["CompressRegionSelection"] = 3] = "CompressRegionSelection";
        Label[Label["ClearNoOpTracker"] = 4] = "ClearNoOpTracker";
        Label[Label["Click"] = 5] = "Click";
        Label[Label["ClipAugmentationOptions"] = 6] = "ClipAugmentationOptions";
        Label[Label["ClipCommonOptions"] = 7] = "ClipCommonOptions";
        Label[Label["ClipPdfOptions"] = 8] = "ClipPdfOptions";
        Label[Label["ClipRegionOptions"] = 9] = "ClipRegionOptions";
        Label[Label["ClipSelectionOptions"] = 10] = "ClipSelectionOptions";
        Label[Label["ClipToOneNoteAction"] = 11] = "ClipToOneNoteAction";
        Label[Label["CloseClipper"] = 12] = "CloseClipper";
        Label[Label["ClosePageNavTooltip"] = 13] = "ClosePageNavTooltip";
        Label[Label["CreateNotebook"] = 14] = "CreateNotebook";
        Label[Label["CreatePage"] = 15] = "CreatePage";
        Label[Label["CreateSection"] = 16] = "CreateSection";
        Label[Label["DebugFeedback"] = 17] = "DebugFeedback";
        Label[Label["DeviceIdMap"] = 18] = "DeviceIdMap";
        Label[Label["FetchNonLocalData"] = 19] = "FetchNonLocalData";
        Label[Label["FullPageScreenshotCall"] = 20] = "FullPageScreenshotCall";
        Label[Label["GetBinaryRequest"] = 21] = "GetBinaryRequest";
        Label[Label["GetCleanDom"] = 22] = "GetCleanDom";
        Label[Label["GetExistingUserInformation"] = 23] = "GetExistingUserInformation";
        Label[Label["GetFlightingAssignments"] = 24] = "GetFlightingAssignments";
        Label[Label["GetLocale"] = 25] = "GetLocale";
        Label[Label["GetLocalizedStrings"] = 26] = "GetLocalizedStrings";
        Label[Label["GetNotebookByName"] = 27] = "GetNotebookByName";
        Label[Label["GetNotebooks"] = 28] = "GetNotebooks";
        Label[Label["GetPage"] = 29] = "GetPage";
        Label[Label["GetPageContent"] = 30] = "GetPageContent";
        Label[Label["GetPages"] = 31] = "GetPages";
        Label[Label["HandleSignInEvent"] = 32] = "HandleSignInEvent";
        Label[Label["HideClipperDueToSpaNavigate"] = 33] = "HideClipperDueToSpaNavigate";
        Label[Label["InvokeClipper"] = 34] = "InvokeClipper";
        Label[Label["InvokeTooltip"] = 35] = "InvokeTooltip";
        Label[Label["InvokeWhatsNew"] = 36] = "InvokeWhatsNew";
        Label[Label["LocalFilesNotAllowedPanelShown"] = 37] = "LocalFilesNotAllowedPanelShown";
        Label[Label["PagesSearch"] = 38] = "PagesSearch";
        Label[Label["PdfByteMetadata"] = 39] = "PdfByteMetadata";
        Label[Label["PdfDataUrlMetadata"] = 40] = "PdfDataUrlMetadata";
        Label[Label["ProcessPdfIntoDataUrls"] = 41] = "ProcessPdfIntoDataUrls";
        Label[Label["RegionSelectionCapturing"] = 42] = "RegionSelectionCapturing";
        Label[Label["RegionSelectionLoading"] = 43] = "RegionSelectionLoading";
        Label[Label["RegionSelectionProcessing"] = 44] = "RegionSelectionProcessing";
        Label[Label["RetrieveUserInformation"] = 45] = "RetrieveUserInformation";
        Label[Label["SendBatchRequest"] = 46] = "SendBatchRequest";
        Label[Label["SetContextProperty"] = 47] = "SetContextProperty";
        Label[Label["SetDoNotPromptRatings"] = 48] = "SetDoNotPromptRatings";
        Label[Label["ShouldShowRatingsPrompt"] = 49] = "ShouldShowRatingsPrompt";
        Label[Label["TooltipImpression"] = 50] = "TooltipImpression";
        Label[Label["UpdatePage"] = 51] = "UpdatePage";
        Label[Label["UserInfoUpdated"] = 52] = "UserInfoUpdated";
        Label[Label["WhatsNewImpression"] = 53] = "WhatsNewImpression";
    })(Label = Event.Label || (Event.Label = {}));
    var BaseEvent = (function () {
        function BaseEvent(labelOrData) {
            this._timerWasStopped = false;
            if (this.isEventData(labelOrData)) {
                var eventData = labelOrData;
                this._label = eventData.Label;
                this._duration = eventData.Duration;
                // TODO theoretically, this is a dangerous set
                // because we're not doing the checks found in .setCustomProperty
                this._properties = eventData.Properties ? JSON.parse(JSON.stringify(eventData.Properties)) : undefined;
            }
            else {
                var label = labelOrData;
                this._label = label;
                this.startTimer();
            }
        }
        BaseEvent.prototype.getDuration = function () {
            return this._duration;
        };
        /**
         * Returns the object's event category. Should be overriden by child classes.
         */
        BaseEvent.prototype.getEventCategory = function () {
            return Event.Category.BaseEvent;
        };
        /**
         * Returns a copy of this BaseEvent's internal data
         * (copy to prevent altering of class internals without setters)
         */
        BaseEvent.prototype.getEventData = function () {
            return {
                Label: this._label,
                Duration: this._duration,
                Properties: this.getCustomProperties()
            };
        };
        BaseEvent.prototype.getLabel = function () {
            return Event.Label[this._label];
        };
        /**
         * Returns a copy of this Event's Properties
         * (copy to prevent altering of class internals without .setCustomProperty())
         */
        BaseEvent.prototype.getCustomProperties = function () {
            return this._properties ? JSON.parse(JSON.stringify(this._properties)) : undefined;
        };
        BaseEvent.prototype.setCustomProperty = function (key, value) {
            if (this.isReservedPropertyName(key)) {
                throw new Error("Tried to overwrite key '" + log_1.PropertyName.Custom[key] + "' with value of " + JSON.stringify(value));
            }
            if (!this._properties) {
                this._properties = {};
            }
            this._properties[log_1.PropertyName.Custom[key]] = value;
        };
        /**
         * Calling this multiple times in a row will result in restart of the timer
         */
        BaseEvent.prototype.startTimer = function () {
            this._startTime = new Date().getTime();
        };
        /**
         * If called multiple times in a row, last call wins
         * If called before startTimer(), nothing happens
         */
        BaseEvent.prototype.stopTimer = function () {
            if (this._startTime) {
                this._duration = new Date().getTime() - this._startTime;
                this._timerWasStopped = true;
                return true;
            }
            return false;
        };
        BaseEvent.prototype.timerWasStopped = function () {
            return this._timerWasStopped;
        };
        BaseEvent.prototype.isEventData = function (labelOrData) {
            var tryCastAsEventData = labelOrData;
            if (tryCastAsEventData && !objectUtils_1.ObjectUtils.isNullOrUndefined(tryCastAsEventData.Label)) {
                return true;
            }
            return false;
        };
        BaseEvent.prototype.isReservedPropertyName = function (value) {
            for (var v in log_1.PropertyName.Reserved) {
                if (log_1.PropertyName.Custom[value].toLowerCase() === v.toLowerCase()) {
                    return true;
                }
            }
            return false;
        };
        return BaseEvent;
    }());
    Event.BaseEvent = BaseEvent;
    var PromiseEvent = (function (_super) {
        __extends(PromiseEvent, _super);
        function PromiseEvent(labelOrData) {
            var _this = _super.call(this, labelOrData) || this;
            _this._logStatus = log_1.Status.Succeeded;
            _this._failureType = log_1.Failure.Type.Unexpected;
            if (_this.isEventData(labelOrData)) {
                var eventData = labelOrData;
                _this._logStatus = eventData.LogStatus;
                _this._failureType = eventData.FailureType;
                _this._failureInfo = log_1.ErrorUtils.clone(eventData.FailureInfo);
            }
            return _this;
        }
        PromiseEvent.prototype.getEventCategory = function () {
            return Event.Category.PromiseEvent;
        };
        /**
         * Returns a copy of this PromiseEvent's internal data
         * (copy to prevent altering of class internals without setters)
         */
        PromiseEvent.prototype.getEventData = function () {
            return {
                Label: this._label,
                Duration: this._duration,
                Properties: this.getCustomProperties(),
                LogStatus: this._logStatus,
                FailureType: this._failureType,
                FailureInfo: log_1.ErrorUtils.clone(this._failureInfo)
            };
        };
        PromiseEvent.prototype.getStatus = function () {
            return log_1.Status[this._logStatus];
        };
        PromiseEvent.prototype.setStatus = function (status) {
            this._logStatus = status;
            if (!this._timerWasStopped) {
                this.stopTimer();
            }
        };
        PromiseEvent.prototype.getFailureInfo = function () {
            return log_1.ErrorUtils.toString(this._failureInfo);
        };
        /**
         * Set this PromiseEvent's FailureInfo to a copy of the GenericError passed in
         * (copy to prevent altering of class internals without this setter)
         */
        PromiseEvent.prototype.setFailureInfo = function (failureInfo) {
            this._failureInfo = log_1.ErrorUtils.clone(failureInfo);
        };
        PromiseEvent.prototype.getFailureType = function () {
            return log_1.Failure.Type[this._failureType];
        };
        PromiseEvent.prototype.setFailureType = function (type) {
            this._failureType = type;
        };
        return PromiseEvent;
    }(BaseEvent));
    Event.PromiseEvent = PromiseEvent;
    var StreamEvent = (function (_super) {
        __extends(StreamEvent, _super);
        function StreamEvent(labelOrData) {
            var _this = _super.call(this, labelOrData) || this;
            _this._stream = [];
            if (_this.isEventData(labelOrData)) {
                var eventData = labelOrData;
                _this._stream = eventData.Stream;
            }
            return _this;
        }
        StreamEvent.prototype.getEventCategory = function () {
            return Event.Category.StreamEvent;
        };
        /**
         * Returns a copy of this StreamEvent's internal data
         * (copy to prevent altering of class internals without setters)
         */
        StreamEvent.prototype.getEventData = function () {
            return {
                Label: this._label,
                Duration: this._duration,
                Properties: this.getCustomProperties(),
                Stream: this._stream
            };
        };
        StreamEvent.prototype.append = function (streamItem) {
            this._stream.push(streamItem);
        };
        return StreamEvent;
    }(BaseEvent));
    Event.StreamEvent = StreamEvent;
    function createEvent(eventCategory, eventData) {
        switch (eventCategory) {
            default:
            case Event.Category.BaseEvent:
                return new Event.BaseEvent(eventData);
            case Event.Category.PromiseEvent:
                return new Event.PromiseEvent(eventData);
            case Event.Category.StreamEvent:
                return new Event.StreamEvent(eventData);
        }
    }
    Event.createEvent = createEvent;
})(Event = exports.Event || (exports.Event = {}));

},{"../../objectUtils":41,"../log":27}],33:[function(require,module,exports){
"use strict";
var Failure;
(function (Failure) {
    Failure.category = "Failure";
    var Type;
    (function (Type) {
        Type[Type["Unexpected"] = 0] = "Unexpected";
        Type[Type["Expected"] = 1] = "Expected"; /* ICE */
    })(Type = Failure.Type || (Failure.Type = {}));
    function getStackTrace(err) {
        if (!err) {
            err = new Error();
        }
        return err.stack;
    }
    Failure.getStackTrace = getStackTrace;
    var Label;
    (function (Label) {
        /* unexpected */
        Label[Label["ClickedButtonWithNoId"] = 0] = "ClickedButtonWithNoId";
        Label[Label["EndSessionWithoutTrigger"] = 1] = "EndSessionWithoutTrigger";
        Label[Label["GetChangeLog"] = 2] = "GetChangeLog";
        Label[Label["GetComputedStyle"] = 3] = "GetComputedStyle";
        Label[Label["GetLocalizedString"] = 4] = "GetLocalizedString";
        Label[Label["GetSetting"] = 5] = "GetSetting";
        Label[Label["IFrameMessageHandlerHasNoOtherWindow"] = 6] = "IFrameMessageHandlerHasNoOtherWindow";
        Label[Label["InvalidArgument"] = 7] = "InvalidArgument";
        Label[Label["IsFeatureEnabled"] = 8] = "IsFeatureEnabled";
        Label[Label["JsonParse"] = 9] = "JsonParse";
        Label[Label["NotImplemented"] = 10] = "NotImplemented";
        Label[Label["OnLaunchOneNoteButton"] = 11] = "OnLaunchOneNoteButton";
        Label[Label["OrphanedWebClippersDueToExtensionRefresh"] = 12] = "OrphanedWebClippersDueToExtensionRefresh";
        Label[Label["RegionSelectionProcessing"] = 13] = "RegionSelectionProcessing";
        Label[Label["RenderFailurePanel"] = 14] = "RenderFailurePanel";
        Label[Label["ReservedPropertyOverwriteAttempted"] = 15] = "ReservedPropertyOverwriteAttempted";
        Label[Label["SessionAlreadySet"] = 16] = "SessionAlreadySet";
        Label[Label["SetLoggerNoop"] = 17] = "SetLoggerNoop";
        Label[Label["SetUndefinedLocalizedStrings"] = 18] = "SetUndefinedLocalizedStrings";
        Label[Label["TraceLevelErrorWarningMessage"] = 19] = "TraceLevelErrorWarningMessage";
        Label[Label["UnhandledApiCode"] = 20] = "UnhandledApiCode";
        Label[Label["UnhandledExceptionThrown"] = 21] = "UnhandledExceptionThrown";
        Label[Label["UserSetWithInvalidExpiredData"] = 22] = "UserSetWithInvalidExpiredData";
        Label[Label["WebExtensionWindowCreate"] = 23] = "WebExtensionWindowCreate";
        /* expected */
        Label[Label["UnclippablePage"] = 24] = "UnclippablePage";
        Label[Label["UnsupportedBrowser"] = 25] = "UnsupportedBrowser";
    })(Label = Failure.Label || (Failure.Label = {}));
})(Failure = exports.Failure || (exports.Failure = {}));

},{}],34:[function(require,module,exports){
"use strict";
var Funnel;
(function (Funnel) {
    Funnel.category = "Funnel";
    var Label;
    (function (Label) {
        Label[Label["Invoke"] = 0] = "Invoke";
        Label[Label["AuthAlreadySignedIn"] = 1] = "AuthAlreadySignedIn";
        Label[Label["AuthAttempted"] = 2] = "AuthAttempted";
        Label[Label["AuthSignInCompleted"] = 3] = "AuthSignInCompleted";
        Label[Label["AuthSignInFailed"] = 4] = "AuthSignInFailed";
        Label[Label["ClipAttempted"] = 5] = "ClipAttempted";
        Label[Label["Interact"] = 6] = "Interact";
        Label[Label["ViewInWac"] = 7] = "ViewInWac";
        Label[Label["SignOut"] = 8] = "SignOut";
    })(Label = Funnel.Label || (Funnel.Label = {}));
})(Funnel = exports.Funnel || (exports.Funnel = {}));

},{}],35:[function(require,module,exports){
"use strict";
var LogMethods;
(function (LogMethods) {
    LogMethods[LogMethods["LogEvent"] = 0] = "LogEvent";
    LogMethods[LogMethods["LogFailure"] = 1] = "LogFailure";
    LogMethods[LogMethods["PushToStream"] = 2] = "PushToStream";
    LogMethods[LogMethods["LogFunnel"] = 3] = "LogFunnel";
    LogMethods[LogMethods["LogSession"] = 4] = "LogSession";
    LogMethods[LogMethods["LogSessionStart"] = 5] = "LogSessionStart";
    LogMethods[LogMethods["LogSessionEnd"] = 6] = "LogSessionEnd";
    LogMethods[LogMethods["LogTrace"] = 7] = "LogTrace";
    LogMethods[LogMethods["LogClickEvent"] = 8] = "LogClickEvent";
    LogMethods[LogMethods["SetContextProperty"] = 9] = "SetContextProperty";
})(LogMethods = exports.LogMethods || (exports.LogMethods = {}));

},{}],36:[function(require,module,exports){
"use strict";
var NoOp;
(function (NoOp) {
    NoOp.category = "NoOp";
    var Label;
    (function (Label) {
        Label[Label["InitializeCommunicator"] = 0] = "InitializeCommunicator";
        Label[Label["WebClipperUiFrameDidNotExist"] = 1] = "WebClipperUiFrameDidNotExist";
        Label[Label["WebClipperUiFrameIsNotVisible"] = 2] = "WebClipperUiFrameIsNotVisible";
    })(Label = NoOp.Label || (NoOp.Label = {}));
})(NoOp = exports.NoOp || (exports.NoOp = {}));

},{}],37:[function(require,module,exports){
"use strict";
var PropertyName;
(function (PropertyName) {
    var Custom;
    (function (Custom) {
        Custom[Custom["AnnotationAdded"] = 0] = "AnnotationAdded";
        Custom[Custom["AugmentationModel"] = 1] = "AugmentationModel";
        Custom[Custom["AverageProcessingDurationPerPage"] = 2] = "AverageProcessingDurationPerPage";
        Custom[Custom["BookmarkInfo"] = 3] = "BookmarkInfo";
        Custom[Custom["ByteLength"] = 4] = "ByteLength";
        Custom[Custom["BytesPerPdfPage"] = 5] = "BytesPerPdfPage";
        Custom[Custom["BytesTrimmed"] = 6] = "BytesTrimmed";
        Custom[Custom["Channel"] = 7] = "Channel";
        Custom[Custom["ClipMode"] = 8] = "ClipMode";
        Custom[Custom["CloseReason"] = 9] = "CloseReason";
        Custom[Custom["ContainsAtLeastOneHighlight"] = 10] = "ContainsAtLeastOneHighlight";
        Custom[Custom["ContentType"] = 11] = "ContentType";
        Custom[Custom["CorrelationId"] = 12] = "CorrelationId";
        Custom[Custom["CurrentPanel"] = 13] = "CurrentPanel";
        Custom[Custom["CurrentSectionStillExists"] = 14] = "CurrentSectionStillExists";
        Custom[Custom["DeviceIdInStorage"] = 15] = "DeviceIdInStorage";
        Custom[Custom["DeviceIdInCookie"] = 16] = "DeviceIdInCookie";
        Custom[Custom["DomSizeInBytes"] = 17] = "DomSizeInBytes";
        Custom[Custom["FeatureEnabled"] = 18] = "FeatureEnabled";
        Custom[Custom["FinalDataUrlLength"] = 19] = "FinalDataUrlLength";
        Custom[Custom["FontSize"] = 20] = "FontSize";
        Custom[Custom["ForceRetrieveFreshLocStrings"] = 21] = "ForceRetrieveFreshLocStrings";
        Custom[Custom["FreshUserInfoAvailable"] = 22] = "FreshUserInfoAvailable";
        Custom[Custom["FullPageScreenshotContentFound"] = 23] = "FullPageScreenshotContentFound";
        Custom[Custom["Height"] = 24] = "Height";
        Custom[Custom["InitialDataUrlLength"] = 25] = "InitialDataUrlLength";
        Custom[Custom["InvokeMode"] = 26] = "InvokeMode";
        Custom[Custom["InvokeSource"] = 27] = "InvokeSource";
        Custom[Custom["IsHighDpiScreen"] = 28] = "IsHighDpiScreen";
        Custom[Custom["IsRetryable"] = 29] = "IsRetryable";
        Custom[Custom["IsSerif"] = 30] = "IsSerif";
        Custom[Custom["Key"] = 31] = "Key";
        Custom[Custom["LastSeenTooltipTime"] = 32] = "LastSeenTooltipTime";
        Custom[Custom["LastUpdated"] = 33] = "LastUpdated";
        Custom[Custom["MaxDepth"] = 34] = "MaxDepth";
        Custom[Custom["NumPages"] = 35] = "NumPages";
        Custom[Custom["NumRegions"] = 36] = "NumRegions";
        Custom[Custom["NumTimesTooltipHasBeenSeen"] = 37] = "NumTimesTooltipHasBeenSeen";
        Custom[Custom["PageNavTooltipType"] = 38] = "PageNavTooltipType";
        Custom[Custom["PageTitleModified"] = 39] = "PageTitleModified";
        Custom[Custom["PdfAllPagesClipped"] = 40] = "PdfAllPagesClipped";
        Custom[Custom["PdfAttachmentClipped"] = 41] = "PdfAttachmentClipped";
        Custom[Custom["PdfFileSelectedPageCount"] = 42] = "PdfFileSelectedPageCount";
        Custom[Custom["PdfFileTotalPageCount"] = 43] = "PdfFileTotalPageCount";
        Custom[Custom["PdfIsBatched"] = 44] = "PdfIsBatched";
        Custom[Custom["PdfIsLocalFile"] = 45] = "PdfIsLocalFile";
        Custom[Custom["RatingsInfo"] = 46] = "RatingsInfo";
        Custom[Custom["ShouldShowRatingsPrompt"] = 47] = "ShouldShowRatingsPrompt";
        Custom[Custom["SignInCancelled"] = 48] = "SignInCancelled";
        Custom[Custom["StoredLocaleDifferentThanRequested"] = 49] = "StoredLocaleDifferentThanRequested";
        Custom[Custom["TimeToClearNoOpTracker"] = 50] = "TimeToClearNoOpTracker";
        Custom[Custom["TooltipType"] = 51] = "TooltipType";
        Custom[Custom["UpdateInterval"] = 52] = "UpdateInterval";
        Custom[Custom["UserInformationReturned"] = 53] = "UserInformationReturned";
        Custom[Custom["UserInformationStored"] = 54] = "UserInformationStored";
        Custom[Custom["UserUpdateReason"] = 55] = "UserUpdateReason";
        Custom[Custom["Url"] = 56] = "Url";
        Custom[Custom["Value"] = 57] = "Value";
        Custom[Custom["VideoDataOriginalSrcUrl"] = 58] = "VideoDataOriginalSrcUrl";
        Custom[Custom["VideoSrcUrl"] = 59] = "VideoSrcUrl";
        Custom[Custom["Width"] = 60] = "Width";
        Custom[Custom["WriteableCookies"] = 61] = "WriteableCookies";
    })(Custom = PropertyName.Custom || (PropertyName.Custom = {}));
    /* tslint:disable:variable-name */
    var Reserved;
    (function (Reserved) {
        Reserved.Category = "Category";
        Reserved.Duration = "Duration";
        Reserved.EventName = "EventName";
        Reserved.EventType = "EventType";
        Reserved.FailureInfo = "FailureInfo";
        Reserved.FailureType = "FailureType";
        Reserved.Id = "Id";
        Reserved.Label = "Label";
        Reserved.Level = "Level";
        Reserved.Message = "Message";
        Reserved.Properties = "Properties";
        Reserved.StackTrace = "StackTrace";
        Reserved.Status = "Status";
        Reserved.Stream = "Stream";
        Reserved.Trigger = "Trigger";
        Reserved.WebClipper = "WebClipper";
    })(Reserved = PropertyName.Reserved || (PropertyName.Reserved = {}));
    /* tslint:enable:variable-name */
})(PropertyName = exports.PropertyName || (exports.PropertyName = {}));

},{}],38:[function(require,module,exports){
"use strict";
var Session;
(function (Session) {
    Session.category = "Session";
    var EndTrigger;
    (function (EndTrigger) {
        EndTrigger[EndTrigger["SignOut"] = 0] = "SignOut";
        EndTrigger[EndTrigger["Unload"] = 1] = "Unload";
    })(EndTrigger = Session.EndTrigger || (Session.EndTrigger = {}));
    var State;
    (function (State) {
        State[State["Started"] = 0] = "Started";
        State[State["Ended"] = 1] = "Ended";
    })(State = Session.State || (Session.State = {}));
})(Session = exports.Session || (exports.Session = {}));

},{}],39:[function(require,module,exports){
"use strict";
var Status;
(function (Status) {
    Status[Status["Succeeded"] = 0] = "Succeeded";
    Status[Status["Failed"] = 1] = "Failed";
})(Status = exports.Status || (exports.Status = {}));

},{}],40:[function(require,module,exports){
"use strict";
var Trace;
(function (Trace) {
    Trace.category = "Trace";
    var Label;
    (function (Label) {
        Label[Label["DefaultingToConsoleLogger"] = 0] = "DefaultingToConsoleLogger";
        Label[Label["DebugMode"] = 1] = "DebugMode";
        Label[Label["RequestForClipperInstalledPageUrl"] = 2] = "RequestForClipperInstalledPageUrl";
    })(Label = Trace.Label || (Trace.Label = {}));
    var Level;
    (function (Level) {
        Level[Level["None"] = 0] = "None";
        Level[Level["Error"] = 1] = "Error";
        Level[Level["Warning"] = 2] = "Warning";
        Level[Level["Information"] = 3] = "Information";
        Level[Level["Verbose"] = 4] = "Verbose";
    })(Level = Trace.Level || (Trace.Level = {}));
})(Trace = exports.Trace || (exports.Trace = {}));

},{}],41:[function(require,module,exports){
"use strict";
var ObjectUtils;
(function (ObjectUtils) {
    function isNumeric(varToCheck) {
        return typeof varToCheck === "number" && !isNaN(varToCheck);
    }
    ObjectUtils.isNumeric = isNumeric;
    function isNullOrUndefined(varToCheck) {
        /* tslint:disable:no-null-keyword */
        return varToCheck === null || varToCheck === undefined;
        /* tslint:enable:no-null-keyword */
    }
    ObjectUtils.isNullOrUndefined = isNullOrUndefined;
})(ObjectUtils = exports.ObjectUtils || (exports.ObjectUtils = {}));

},{}],42:[function(require,module,exports){
"use strict";
var promise = require("es6-promise");
var Polyfills;
(function (Polyfills) {
    function init() {
        endsWithPoly();
        objectAssignPoly();
        promisePoly();
        requestAnimationFramePoly();
    }
    Polyfills.init = init;
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
    function endsWithPoly() {
        if (!String.prototype.endsWith) {
            String.prototype.endsWith = function (searchString, position) {
                var subjectString = this.toString();
                if (typeof position !== "number" || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                    position = subjectString.length;
                }
                position -= searchString.length;
                var lastIndex = subjectString.lastIndexOf(searchString, position);
                return lastIndex !== -1 && lastIndex === position;
            };
        }
    }
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
    function objectAssignPoly() {
        if (typeof Object.assign !== "function") {
            Object.assign = function (target) {
                if (!target) {
                    throw new TypeError("Cannot convert undefined to object");
                }
                var output = Object(target);
                for (var index = 1; index < arguments.length; index++) {
                    var source = arguments[index];
                    if (source) {
                        for (var nextKey in source) {
                            if (source.hasOwnProperty(nextKey)) {
                                output[nextKey] = source[nextKey];
                            }
                        }
                    }
                }
                return output;
            };
        }
    }
    function promisePoly() {
        if (typeof Promise === "undefined") {
            promise.polyfill();
        }
    }
    function requestAnimationFramePoly() {
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window.msRequestAnimationFrame || window.mozRequestAnimationFrame
                || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame || (function (callback) {
                setTimeout(function () {
                    callback(Date.now());
                }, 16);
            });
        }
    }
})(Polyfills = exports.Polyfills || (exports.Polyfills = {}));

},{"es6-promise":45}],43:[function(require,module,exports){
"use strict";
var constants_1 = require("../constants");
var RemoteStorage = (function () {
    function RemoteStorage(extCommunicator) {
        this.storageCache = {};
        this.extensionCommunicator = extCommunicator;
    }
    RemoteStorage.prototype.getCachedValue = function (key) {
        return this.storageCache[key];
    };
    RemoteStorage.prototype.getValue = function (key, callback, cacheValue) {
        var _this = this;
        this.extensionCommunicator.callRemoteFunction(constants_1.Constants.FunctionKeys.getStorageValue, {
            param: key, callback: function (value) {
                if (cacheValue) {
                    _this.storageCache[key] = value;
                }
                callback(value);
            }
        });
    };
    RemoteStorage.prototype.getValues = function (keys, callback, cacheValue) {
        var _this = this;
        this.extensionCommunicator.callRemoteFunction(constants_1.Constants.FunctionKeys.getMultipleStorageValues, { param: keys, callback: function (values) {
                if (cacheValue) {
                    for (var key in values) {
                        if (values.hasOwnProperty(key)) {
                            _this.storageCache[key] = values[key];
                        }
                    }
                }
                callback(values);
            } });
    };
    RemoteStorage.prototype.setValue = function (key, value, callback) {
        if (key in this.storageCache) {
            this.storageCache[key] = value;
        }
        this.extensionCommunicator.callRemoteFunction(constants_1.Constants.FunctionKeys.setStorageValue, {
            param: { key: key, value: value }, callback: function (retVal) {
                if (callback) {
                    callback(retVal);
                }
            }
        });
    };
    return RemoteStorage;
}());
exports.RemoteStorage = RemoteStorage;

},{"../constants":22}],44:[function(require,module,exports){
module.exports={
	"WebClipper.Accessibility.ScreenReader.CurrentModeHasChanged": "The current clipping mode is now '{0}'",
	"WebClipper.Accessibility.ScreenReader.ClippingPageToOneNote": "Clipping the current page to OneNote",
	"WebClipper.Accessibility.ScreenReader.ChangeFontToSansSerif": "Change font to Sans-Serif",
	"WebClipper.Accessibility.ScreenReader.ChangeFontToSerif": "Change font to Serif",
	"WebClipper.Accessibility.ScreenReader.DecreaseFontSize": "Decrease font size",
	"WebClipper.Accessibility.ScreenReader.IncreaseFontSize": "Increase font size",
	"WebClipper.Accessibility.ScreenReader.ToggleHighlighterForArticleMode": "Toggle Highlighter Mode For Article",
	"WebClipper.Accessibility.ScreenReader.InputBoxToChangeTitleOfOneNotePage": "Text input to edit the title of the page you want to save",
	"WebClipper.Accessibility.ScreenReader.InputBoxToChangeNotesToAddToPage": "Text input to edit the notes to save along with this page",
	"WebClipper.Action.BackToHome": "Back",
	"WebClipper.Action.Cancel": "Cancel",
	"WebClipper.Action.Clip": "Clip",
	"WebClipper.Action.CloseTheClipper": "Close the Clipper",
	"WebClipper.Action.Feedback": "Feedback?",
	"WebClipper.Action.RefreshPage": "Refresh Page",
	"WebClipper.Action.Signin": "Sign In",
	"WebClipper.Action.SigninMsa": "Sign in with a Microsoft account",
	"WebClipper.Action.SigninOrgId": "Sign in with a work or school account",
	"WebClipper.Action.SignOut": "Sign Out",
	"WebClipper.Action.TryAgain": "Try Again",
	"WebClipper.Action.ViewInOneNote": "View in OneNote",
	"WebClipper.Action.Less": "Less",
	"WebClipper.Action.More": "More",
	"WebClipper.BetaTag": "beta",
	"WebClipper.ClipType.Article.Button": "Article",
	"WebClipper.ClipType.Article.ProgressLabel": "Clipping Article",
	"WebClipper.ClipType.Bookmark.Button": "Bookmark",
	"WebClipper.ClipType.Bookmark.Button.Tooltip": "Clip just the title, thumbnail, synopsis, and link.",
	"WebClipper.ClipType.Bookmark.ProgressLabel": "Clipping Bookmark",
	"WebClipper.ClipType.Button.Tooltip": "Clip just the {0} in an easy-to-read format.",
	"WebClipper.ClipType.Image.Button": "Image",
	"WebClipper.ClipType.ImageSnippet.Button": "Image Snippet",
	"WebClipper.ClipType.MultipleRegions.Button.Tooltip": "Take screenshots of parts of the page you\u0027ll select.",
	"WebClipper.ClipType.Pdf.Button": "PDF Document",
	"WebClipper.ClipType.Pdf.AskPermissionToClipLocalFile": "We need your permission to clip PDF files stored on your computer",
	"WebClipper.ClipType.Pdf.InstructionsForClippingLocalFiles": "In Chrome, right-click the OneNote icon in the toolbar and choose \u0022Manage Extension\u0027. Then, for OneNote Web Clipper, check \u0027Allow access to file URLs.\u0027",
	"WebClipper.ClipType.Pdf.ProgressLabel": "Clipping PDF File",
	"WebClipper.ClipType.Pdf.ProgressLabelDelay": "PDFs can take a little while to upload. Still clipping.”",
	"WebClipper.ClipType.Pdf.IncrementalProgressMessage": "Clipping page {0} of {1}...",
	"WebClipper.ClipType.Pdf.Button.Tooltip": "Take a screenshot of the whole PDF file and save a copy of the attachment.",
	"WebClipper.ClipType.Product.Button": "Product",
	"WebClipper.ClipType.Product.ProgressLabel": "Clipping Product",
	"WebClipper.ClipType.Recipe.Button": "Recipe",
	"WebClipper.ClipType.Recipe.ProgressLabel": "Clipping Recipe",
	"WebClipper.ClipType.Region.Button": "Region",
	"WebClipper.ClipType.Region.Button.Tooltip": "Take a screenshot of the part of the page you\u0027ll select.",
	"WebClipper.ClipType.Region.ProgressLabel": "Clipping Region",
	"WebClipper.ClipType.ScreenShot.Button": "Full Page",
	"WebClipper.ClipType.ScreenShot.Button.Tooltip": "Take a screenshot of the whole page, just like you see it.",
	"WebClipper.ClipType.ScreenShot.ProgressLabel": "Clipping Page",
	"WebClipper.ClipType.Selection.Button": "Selection",
	"WebClipper.ClipType.Selection.Button.Tooltip": "Clip the selection you made on the web page.",
	"WebClipper.ClipType.Selection.ProgressLabel": "Clipping Selection",
	"WebClipper.Error.ConflictingExtension": "Your PDF viewer or another extension might be blocking the OneNote Web Clipper. You could temporarily disable the following extension and try clipping again.",
	"WebClipper.Error.CannotClipPage": "Sorry, this type of page can\u0027t be clipped.",
	"WebClipper.Error.CookiesDisabled.Line1": "Cookies must be enabled in order for OneNote Web Clipper to work correctly.",
	"WebClipper.Error.CookiesDisabled.Line2": "Please allow third-party cookies in your browser or add the onenote.com and live.com domains as an exception.",
	"WebClipper.Error.CookiesDisabled.Chrome": "Please allow third-party cookies in your browser or add the [*.]onenote.com and [*.]live.com domains as an exception.",
	"WebClipper.Error.CookiesDisabled.Edge": "Please allow third-party cookies in your browser.",
	"WebClipper.Error.CookiesDisabled.Firefox": "Please allow third-party cookies in your browser or add the https://onenote.com and https://live.com domains as an exception.",
	"WebClipper.Error.CorruptedSection": "Your clip can\u0027t be saved here because the section is corrupt.",
	"WebClipper.Error.GenericError": "Something went wrong. Please try clipping the page again.",
	"WebClipper.Error.GenericExpiredTokenRefreshError": "Your login session has ended and we were unable to clip the page. Please sign in again.",
	"WebClipper.Error.NoOpError":  "Sorry, we can\u0027t clip this page right now",
	"WebClipper.Error.NotProvisioned": "Your clip can\u0027t be saved because your OneDrive for Business account isn\u0027t set up.",
	"WebClipper.Error.OrphanedWebClipperDetected": "Something went wrong. Please refresh this page, and try to clip again.",
	"WebClipper.Error.PasswordProtected": "Your clip can\u0027t be saved here because the section is password protected.",
	"WebClipper.Error.QuotaExceeded": "Your clip can\u0027t be saved because your OneDrive account has reached its size limit.",
	"WebClipper.Error.ResourceDoesNotExist": "Your clip can\u0027t be saved here because the location no longer exists. Please try clipping to another location.",
	"WebClipper.Error.SectionTooLarge": "Your clip can\u0027t be saved here because the section has reached its size limit.",
	"WebClipper.Error.SignInUnsuccessful": "We couldn\u0027t sign you in. Please try again.",
	"WebClipper.Error.ThirdPartyCookiesDisabled": "For OneNote Web Clipper to work correctly, please allow third-party cookies in your browser, or add the onenote.com domain as an exception.",
	"WebClipper.Error.UserAccountSuspended": "Your clip can\u0027t be saved because your Microsoft account has been suspended.",
	"WebClipper.Error.UserAccountSuspendedResetText": "Reset Your Account",
	"WebClipper.Error.UserDoesNotHaveUpdatePermission": "We\u0027ve added features to the Web Clipper that require new permissions. To accept them, please sign out and sign back in.",
	"WebClipper.Extension.RefreshTab": "Please refresh this page, and try to clip again.",
	"WebClipper.FromCitation": "Clipped from: {0}",
	"WebClipper.Label.Annotation": "Note",
	"WebClipper.Label.AnnotationPlaceholder": "Add a note...",
	"WebClipper.Label.PageTitlePlaceholder": "Add a page title...",
	"WebClipper.Label.AttachPdfFile": "Attach PDF file",
	"WebClipper.Label.AttachPdfFileSubText": "(all pages)",
	"WebClipper.Label.ClipImageToOneNote": "Clip Image to OneNote",
	"WebClipper.Label.ClipLocation": "Location",
	"WebClipper.Label.ClipSelectionToOneNote": "Clip Selection to OneNote",
	"WebClipper.Label.ClipSuccessful": "Clip Successful!",
	"WebClipper.Label.DragAndRelease": "Drag and release to capture a screenshot",
	"WebClipper.Label.OneNoteClipper": "OneNote Clipper",
	"WebClipper.Label.OneNoteWebClipper": "OneNote Web Clipper",
	"WebClipper.Label.OpenChangeLogFromTooltip": "Check out what\u0027s new",
	"WebClipper.Label.Page": "Page",
	"WebClipper.Label.PdfAllPagesRadioButton": "All pages",
	"WebClipper.Label.PdfDistributePagesCheckbox": "New note for each PDF page",
	"WebClipper.Label.PdfOptions": "PDF Options",
	"WebClipper.Label.PdfTooLargeToAttach": "PDF too large to attach",
	"WebClipper.Label.PdfTooltip": "Clip this PDF to OneNote, and read it later",
	"WebClipper.Label.ProceedToWebClipper": "Proceed to the Web Clipper",
	"WebClipper.Label.ProceedToWebClipperFun": "Try it out!",
	"WebClipper.Label.ProductTooltip": "Clip and save product details like this to OneNote",
	"WebClipper.Label.Ratings.Message.End": "Thanks for your feedback!",
	"WebClipper.Label.Ratings.Message.Feedback": "Help us improve",
	"WebClipper.Label.Ratings.Message.Init": "Enjoying the Web Clipper?",
	"WebClipper.Label.Ratings.Message.Rate": "Glad you like it!",
	"WebClipper.Label.Ratings.Button.Feedback": "Provide feedback",
	"WebClipper.Label.Ratings.Button.Init.Positive": "Yes, it\u0027s great!",
	"WebClipper.Label.Ratings.Button.Init.Negative": "Not really...",
	"WebClipper.Label.Ratings.Button.NoThanks": "No thanks",
	"WebClipper.Label.Ratings.Button.Rate": "Rate us 5 stars",
	"WebClipper.Label.RecipeTooltip": "Save clutter-free recipes right to OneNote",
	"WebClipper.Label.SignedIn": "Signed in",
	"WebClipper.Label.SignInDescription": "Save anything on the web to OneNote in one click",
	"WebClipper.Label.SignInUnsuccessfulMoreInformation": "More information",
	"WebClipper.Label.SignInUnsuccessfulLessInformation": "Less information",
	"WebClipper.Label.UnsupportedBrowser": "Sorry, your browser version is unsupported.",
	"WebClipper.Label.WebClipper": "Web Clipper",
	"WebClipper.Label.WebClipperWasUpdated": "OneNote Web Clipper has been updated",
	"WebClipper.Label.WebClipperWasUpdatedFun": "OneNote Web Clipper is now better than ever!",
	"WebClipper.Label.WhatsNew": "What's New",
	"WebClipper.Label.VideoTooltip": "Clip this video and watch it anytime in OneNote",
	"WebClipper.Popover.PdfInvalidPageRange": "We couldn't find page '{0}'",
	"WebClipper.Preview.AugmentationModeGenericError": "Something went wrong creating the preview. Try again, or choose a different clipping mode.",
	"WebClipper.Preview.BookmarkModeGenericError": "Something went wrong creating the bookmark. Try again, or choose a different clipping mode.",
	"WebClipper.Preview.FullPageModeGenericError": "A preview isn't available, but you can still clip your page.",
	"WebClipper.Preview.FullPageModeScreenshotDescription": "A full page screenshot of '{0}'",
	"WebClipper.Preview.LoadingMessage": "Loading preview...",
	"WebClipper.Preview.NoFullPageScreenshotFound": "No content found. Try another clipping mode.",
	"WebClipper.Preview.NoContentFound": "No article found. Try another clipping mode.",
	"WebClipper.Preview.UnableToClipLocalFile": "Local files can only be clipped using Region mode.",
	"WebClipper.Preview.Header.AddAnotherRegionButtonLabel": "Add another region",
	"WebClipper.Preview.Header.SansSerifButtonLabel": "Sans-serif",
	"WebClipper.Preview.Header.SerifButtonLabel": "Serif",
	"WebClipper.Preview.Spinner.ClipAnyTimeInFullPage": "In a hurry? You can clip any time in Full Page mode!",
	"WebClipper.SectionPicker.DefaultLocation":  "Default location",
	"WebClipper.SectionPicker.LoadingNotebooks": "Loading notebooks...",
	"WebClipper.SectionPicker.NoNotebooksFound": "You don't have any notebooks yet, so we'll create your default notebook when you clip this page.",
	"WebClipper.SectionPicker.NotebookLoadFailureMessage": "OneNote couldn't load your notebooks. Please try again later.",
	"WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessage": "OneNote couldn't load your notebooks.",
	"WebClipper.SectionPicker.NotebookLoadUnretryableFailureMessageWithExplanation": "We couldn't load your notebooks because a list limit was exceeded in OneDrive.",
	"WebClipper.SectionPicker.NotebookLoadUnretryableFailureLinkMessage": "Learn more",
	"WebClipper.FontFamily.Regular": "Segoe UI Regular,Segoe UI,Segoe,Segoe WP,Helvetica Neue,Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
	"WebClipper.FontFamily.Bold": "Segoe UI Bold,Segoe UI,Segoe,Segoe WP,Helvetica Neue,Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
	"WebClipper.FontFamily.Light": "Segoe UI Light,Segoe WP Light,Segoe UI,Segoe,Segoe WP,Helvetica Neue,Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
	"WebClipper.FontFamily.Preview.SerifDefault": "Georgia",
	"WebClipper.FontFamily.Preview.SansSerifDefault": "Verdana",
	"WebClipper.FontFamily.Semibold": "Segoe UI Semibold,Segoe UI,Segoe,Segoe WP,Helvetica Neue,Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
	"WebClipper.FontFamily.Semilight": "Segoe UI Semilight,Segoe UI Light,Segoe WP Light,Segoe UI,Segoe,Segoe WP,Helvetica Neue,Roboto,Helvetica,Arial,Tahoma,Verdana,sans-serif",
	"WebClipper.FontSize.Preview.SerifDefault": "16px",
	"WebClipper.FontSize.Preview.SansSerifDefault": "16px"
}

},{}],45:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   4.0.5
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
};

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":46}],46:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[12]);
