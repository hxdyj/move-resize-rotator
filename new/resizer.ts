import { omit } from "lodash";

type Point = {
  x: number;
  y: number;
};

type FixPos =
  | 1
  | 2
  | 3
  | 4
  | "TopLeft"
  | "TopRight"
  | "BottomRight"
  | "BottomLeft";

type Size = {
  left: number;
  top: number;
  width: number;
  height: number;
  cx?: number;
  cy?: number;
};
type CallbackEvent = MouseOrTouchEvent & {
  size: Size;
  angle: number;
  evtTarget: unknown;
  handler: ResizerDiv | null;
};
type Callback = null | ((event: CallbackEvent) => void);
type OptionsType = {
  enableMove: boolean;
  enableMoveX: boolean;
  enableMoveY: boolean;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  aspectRatio: boolean;
  resizeFromCenter: boolean;
  onDragStart: Callback;
  onDragging: Callback;
  onDragEnd: Callback;
  onResizeStart: Callback;
  onResizing: Callback;
  onResizeEnd: Callback;
  onRotateStart: Callback;
  onRotating: Callback;
  onRotateEnd: Callback;
  onResizerShown: Callback;
  onResizerHide: Callback;
  isHideOnResize: boolean;
  isHoverLine: boolean;
  resizers: ResizerType;
};
type ResizerType = {
  n: boolean;
  s: boolean;
  e: boolean;
  w: boolean;
  ne: boolean;
  nw: boolean;
  se: boolean;
  sw: boolean;
  r: boolean;
};
type Coordinate = {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  cx: number;
  cy: number;
  dx: number;
  dy: number;
  px: number;
  py: number;
};
type MouseOrTouchEvent = MouseEvent | TouchEvent;
type ResizerTargetElement = HTMLElement & {
  options: OptionsType | null;
  angle: number;
  resizer: boolean | ResizerDiv | null;
  coord: Coordinate;
  isDisabled: boolean;
  bBox: DOMRect;
  scale: number;
  moveCounter: number;
  isLocked: boolean;
  startPos: Point;
  size: Size;
  newSize: Size;
  distanceParent?: Point;
  timeOut: ReturnType<typeof setTimeout> | null;
  handleMouseEnter: (e: MouseOrTouchEvent) => void;
  handleMouseLeave: (e: MouseOrTouchEvent) => void;
  handleMousedown: (e: MouseOrTouchEvent) => void;
  handleClick: (e: MouseOrTouchEvent) => void;
};

type ResizerDiv = HTMLDivElement & {
  nw_resizer: HTMLDivElement;
  ne_resizer: HTMLDivElement;
  sw_resizer: HTMLDivElement;
  se_resizer: HTMLDivElement;
  n_resizer: HTMLDivElement;
  e_resizer: HTMLDivElement;
  s_resizer: HTMLDivElement;
  w_resizer: HTMLDivElement;
  r_resizer: HTMLDivElement;
  resizer_border: ResizerBorderDiv;
  current: any;
  startPos: Point;
  visibile: boolean;
  _target?: ResizerTargetElement;
  target?: ResizerTargetElement;
  angle?: number;
  showHideResizer?: (isHide: boolean, resizerHandle?: ResizerDiv) => void;
};
type ResizerBorderDiv = HTMLDivElement & {
  actionName: string;
};

type ResizerHoverLineDiv = HTMLDivElement & {
  target: unknown;
};

const resizer = {
  target: null as ResizerTargetElement | null,
  resizer: null as ResizerDiv | null,
  hoverLine: null as ResizerHoverLineDiv | null,
  parentBounding: null as null | DOMRect,

  add(
    ele: HTMLElement,
    options?: Omit<Partial<OptionsType>, "resizers"> & {
      resizers: Partial<ResizerType>;
    },
  ) {
    let target = ele as unknown as ResizerTargetElement;
    this.target = target;
    if (target) {
      let defaultOptions: OptionsType = {
        enableMove: true,
        enableMoveX: true,
        enableMoveY: true,
        minWidth: 30,
        minHeight: 30,
        maxHeight: Infinity,
        maxWidth: Infinity,
        aspectRatio: true,
        resizeFromCenter: false,
        onDragStart: null,
        onDragging: null,
        onDragEnd: null,
        onResizeStart: null,
        onResizing: null,
        onResizeEnd: null,
        onRotateStart: null,
        onRotating: null,
        onRotateEnd: null,
        onResizerShown: null,
        onResizerHide: null,
        isHideOnResize: true,
        isHoverLine: true,
        resizers: {
          n: true,
          s: true,
          e: true,
          w: true,
          ne: true,
          nw: true,
          se: true,
          sw: true,
          r: true,
        },
      };
      let getAngle = (target: ResizerTargetElement) => {
        let angle = 0;
        if (target) {
          angle = parseFloat(target.angle + "");
          if (isNaN(angle)) {
            angle = 0;
            let tmatrix = window.getComputedStyle(
              target as unknown as Element,
            ).transform;
            if (tmatrix && tmatrix != "none") {
              let matrixValues = tmatrix.split("(")[1].split(")")[0].split(",");
              let matrix_a = Number(matrixValues[0]);
              let matrix_b = Number(matrixValues[1]);
              let rotationInRadians = Math.atan2(matrix_b, matrix_a);
              angle = rotationInRadians * (180 / Math.PI);
              if (angle < 0) {
                angle = 360 + angle;
              }
            }
          }
          target.angle = angle;
        }
        return angle;
      };
      if (options && options.resizers) {
        Object.assign(defaultOptions.resizers, options.resizers);
      }
      target.options = { ...defaultOptions, ...omit(options, ["resizers"]) };
      target.style.position = "absolute";
      target.style.left = target.offsetLeft + "px";
      target.style.top = target.offsetTop + "px";
      target.style.width = target.offsetWidth + "px";
      target.style.height = target.offsetHeight + "px";
      target.angle = getAngle(target);
      target.resizer = true;
      target.isDisabled = target.getAttribute("isDisabled") === "true";
      if (target.isDisabled) {
        target.resizer = false;
      }
      let bBox = this.show(target);
      target.bBox = bBox;
      target.scale = bBox.width / target.offsetWidth;
      target.moveCounter = 0;
      target.resizer = this.resizer;
      if (!document.querySelector(".resizer-container") && target.resizer) {
        document.body.appendChild(target.resizer);
      }
      let handleMousedown = (e: MouseOrTouchEvent) => {
        if (e.type === "mousedown") {
          e.preventDefault();
        }
        e.stopPropagation();
        target.isDisabled = target.getAttribute("isDisabled") === "true";
        if (target.isDisabled) {
          target.resizer = false;
          this.hide();
        }
        target.isLocked = target.getAttribute("islocked") === "true";
        if (e instanceof MouseEvent && target.options?.enableMove) {
          target.startPos = {
            x: e.clientX + document.body.scrollLeft,
            y: e.clientY + document.body.scrollTop,
          };
        }
        target.size = {
          left: target.offsetLeft,
          top: target.offsetTop,
          width: target.offsetWidth,
          height: target.offsetHeight,
        };

        if (this.parentBounding && !target.distanceParent) {
          let childBounding = target.getBoundingClientRect();
          target.distanceParent = {
            x: childBounding.x - this.parentBounding.x - target.size.left,
            y: childBounding.y - this.parentBounding.y - target.size.top,
          };
        }

        if (
          !target.isLocked &&
          !target.isDisabled &&
          target.options?.enableMove
        ) {
          document.addEventListener("mousemove", handleMousemove);
          document.addEventListener("mouseup", handleMouseup);
          document.addEventListener("touchmove", handleMousemove);
          document.addEventListener("touchend", handleMouseup);
        }
        if (
          e.type === "touchstart" &&
          e instanceof TouchEvent &&
          target.options?.enableMove
        ) {
          if (e.touches.length > 1) {
            return;
          }
          target.startPos = {
            x: e.touches[0].clientX + document.body.scrollLeft,
            y: e.touches[0].clientY + document.body.scrollTop,
          };
        }
        if (target.resizer && target.resizer instanceof HTMLElement) {
          target.resizer.visibile = false;
        }
        this.show(target);
        this.target = target;
        let handleClick = (e: MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          this.show(target);
          window.removeEventListener("click", handleClick, true);
        };
        window.addEventListener("click", handleClick, true);
        target.moveCounter = 0;
        this.hoverLine && (this.hoverLine.style.opacity = "0");
      };
      let handleMousemove = (event: MouseOrTouchEvent) => {
        let e = event as CallbackEvent;
        e.stopPropagation();
        e.type === "mousemove" && e.preventDefault();

        target.moveCounter++;
        if (target.moveCounter === 1) {
          e.size = { ...target.size };
          e.angle = target.angle;
          e.evtTarget = target;
          e.handler = this.resizer;
          if (target.options) {
            target.options.onDragStart && target.options.onDragStart(e);
          }
          if (
            target.resizer &&
            target.resizer instanceof HTMLElement &&
            target.resizer.showHideResizer
          ) {
            target.resizer.showHideResizer(true);
          }
        }
        let x = 0;
        let y = 0;

        if (e instanceof MouseEvent) {
          if (target.options?.enableMove && target.options?.enableMoveX) {
            x = e.clientX + document.body.scrollLeft - target.startPos.x;
          } else {
            x = document.body.scrollLeft;
          }

          if (target.options?.enableMove && target.options?.enableMoveY) {
            y = e.clientY + document.body.scrollTop - target.startPos.y;
          } else {
            y = document.body.scrollTop;
          }
        }

        if (e.type === "touchmove" && e instanceof TouchEvent) {
          if (target.options?.enableMove && target.options?.enableMoveX) {
            x =
              e.touches[0].clientX +
              document.body.scrollLeft -
              target.startPos.x;
          }
          if (target.options?.enableMove && target.options?.enableMoveY) {
            y =
              e.touches[0].clientY +
              document.body.scrollTop -
              target.startPos.y;
          } else {
            y = document.body.scrollTop;
          }
        }
        let newX = target.size.left + x / target.scale;
        let newY = target.size.top + y / target.scale;

        if (this.parentBounding && target.distanceParent) {
          let size = target.newSize || target.size;
          if (newX < target.distanceParent.x) {
            newX = target.distanceParent.x;
          }
          if (
            newX + size.width >
            target.distanceParent.x + this.parentBounding.width
          ) {
            newX =
              target.distanceParent.x + this.parentBounding.width - size.width;
          }

          if (newY < target.distanceParent.y) {
            newY = target.distanceParent.y;
          }

          if (
            newY + size.height >
            target.distanceParent.y + this.parentBounding.height
          ) {
            newY =
              target.distanceParent.y +
              this.parentBounding.height -
              size.height;
          }
        }
        target.style.left = newX + "px";
        target.style.top = newY + "px";
        target.newSize = { ...target.size, left: newX, top: newY };
        //dispatch Events
        if (target.options && target.options.onDragging) {
          e.size = { ...target.newSize };
          e.angle = target.angle;
          e.evtTarget = target;
          e.handler = this.resizer;
          target.options.onDragging(e);
        }
        this.show(target);
      };
      let handleMouseup = (event: MouseOrTouchEvent) => {
        let e = event as unknown as CallbackEvent;
        e.stopPropagation();
        e.type === "mouseup" && e.preventDefault();
        document.removeEventListener("mousemove", handleMousemove);
        document.removeEventListener("mouseup", handleMouseup);
        document.removeEventListener("touchmove", handleMousemove);
        document.removeEventListener("touchend", handleMouseup);
        if (
          target.resizer &&
          target.resizer instanceof HTMLElement &&
          target.resizer.showHideResizer
        ) {
          target.resizer?.showHideResizer(false);
        }
        //dispatch Events
        if (target.moveCounter && target.options && target.options.onDragEnd) {
          e.size = { ...target.newSize };
          e.angle = target.angle;
          e.evtTarget = target;
          e.handler = this.resizer;
          target.options.onDragEnd(e);
        }
        this.show(target);

        target.dispatchEvent(new MouseEvent("click"));
      };

      target.handleMouseEnter = (e: MouseOrTouchEvent) => {
        if (this.target != e.target) {
          let tmpTarget = e.target as unknown as ResizerTargetElement;
          if (tmpTarget.options && !tmpTarget.options.isHoverLine) return;
          let getBorderBox = (target: ResizerTargetElement) => {
            let _hoverLine = target.cloneNode() as ResizerTargetElement;
            _hoverLine.innerHTML = "";
            _hoverLine.style.cssText = target.style.cssText;
            _hoverLine.style.opacity = "0";
            _hoverLine.style.pointerEvents = "none";
            let transform = _hoverLine.style.transform;
            if (transform && transform.indexOf("rotate") >= 0) {
              _hoverLine.style.transform = transform.replace(
                /rotate\(\w*\)/gi,
                "",
              );
            } else if (target.angle) {
              _hoverLine.style.transform = transform + " rotate(0deg)";
            }
            if (target.parentNode) {
              target.parentNode.appendChild(_hoverLine);
            }
            let bBox = _hoverLine.getBoundingClientRect();
            _hoverLine.remove();
            return bBox;
          };
          let hoverLine = document.querySelector(
            ".resizer-target-hover-line",
          ) as ResizerHoverLineDiv;
          !hoverLine &&
            (hoverLine = document.createElement("div") as ResizerHoverLineDiv);
          hoverLine.className = "resizer-target-hover-line";
          hoverLine.style.position = "absolute";
          document.body.appendChild(hoverLine);
          this.hoverLine = hoverLine;
          let bBox = getBorderBox(tmpTarget);
          hoverLine.style.left = bBox.left + window.scrollX + "px";
          hoverLine.style.top = bBox.top + window.scrollY + "px";
          hoverLine.style.width = bBox.width + 2 + "px";
          hoverLine.style.height = bBox.height + 2 + "px";
          hoverLine.style.opacity = "1";
          hoverLine.style.transform =
            "rotate(" + (tmpTarget.angle || 0) + "deg)";
          hoverLine.target = e.target;
        }
      };
      target.handleMouseLeave = (e) => {
        this.hoverLine && (this.hoverLine.style.opacity = "0");
      };

      if (!target.handleMousedown) {
        target.handleMousedown = handleMousedown;
        target.removeEventListener("mousedown", handleMousedown);
        target.addEventListener("mousedown", handleMousedown);
        target.removeEventListener("touchstart", handleMousedown);
        target.addEventListener("touchstart", handleMousedown);
        target.handleClick = (e) => {
          e.stopPropagation();
        };
        target.removeEventListener("click", target.handleClick);
        target.addEventListener("click", target.handleClick);
        target.addEventListener("mouseenter", target.handleMouseEnter);
        target.addEventListener("mouseleave", target.handleMouseLeave);
      }
    }
  },
  show(ele: HTMLElement) {
    let target = ele as ResizerTargetElement;
    let that = this;
    if (target && target.resizer) {
      if (!this.resizer) {
        let resizer = document.querySelector(
          ".resizer-container",
        ) as ResizerDiv;
        resizer && resizer.remove();
        //create new resizer-container
        resizer = document.createElement("div") as ResizerDiv;
        resizer.className = "resizer-container";
        resizer.style.position = "absolute";
        document.body.appendChild(resizer);
        this.resizer = resizer;

        let resizer_border = document.createElement("div") as ResizerBorderDiv;
        resizer_border.className = "resizer-border";
        resizer_border.actionName = "resizer-border";
        resizer.resizer_border = resizer_border;
        resizer.appendChild(resizer_border);

        let nw_resizer = document.createElement("div") as ResizerBorderDiv;
        nw_resizer.className = "nw-resizer";
        nw_resizer.actionName = "nw-resizer";
        resizer.nw_resizer = nw_resizer;
        resizer.appendChild(nw_resizer);

        let ne_resizer = document.createElement("div") as ResizerBorderDiv;
        ne_resizer.className = "ne-resizer";
        ne_resizer.actionName = "ne-resizer";
        resizer.ne_resizer = ne_resizer;
        resizer.appendChild(ne_resizer);

        let sw_resizer = document.createElement("div") as ResizerBorderDiv;
        sw_resizer.className = "sw-resizer";
        sw_resizer.actionName = "sw-resizer";
        resizer.sw_resizer = sw_resizer;
        resizer.appendChild(sw_resizer);

        let se_resizer = document.createElement("div") as ResizerBorderDiv;
        se_resizer.className = "se-resizer";
        se_resizer.actionName = "se-resizer";
        resizer.se_resizer = se_resizer;
        resizer.appendChild(se_resizer);

        let n_resizer = document.createElement("div") as ResizerBorderDiv;
        n_resizer.className = "n-resizer";
        n_resizer.actionName = "n-resizer";
        resizer.n_resizer = n_resizer;
        resizer.appendChild(n_resizer);

        let e_resizer = document.createElement("div") as ResizerBorderDiv;
        e_resizer.className = "e-resizer";
        e_resizer.actionName = "e-resizer";
        resizer.e_resizer = e_resizer;
        resizer.appendChild(e_resizer);

        let s_resizer = document.createElement("div") as ResizerBorderDiv;
        s_resizer.className = "s-resizer";
        s_resizer.actionName = "s-resizer";
        resizer.s_resizer = s_resizer;
        resizer.appendChild(s_resizer);

        let w_resizer = document.createElement("div") as ResizerBorderDiv;
        w_resizer.className = "w-resizer";
        w_resizer.actionName = "w-resizer";
        resizer.w_resizer = w_resizer;
        resizer.appendChild(w_resizer);

        let r_resizer = document.createElement("div") as ResizerBorderDiv;
        r_resizer.className = "r-resizer";
        r_resizer.actionName = "r-resizer";
        resizer.r_resizer = r_resizer;
        resizer.appendChild(r_resizer);

        let ddmrr_angle_div = document.createElement("div");
        ddmrr_angle_div.className = "rotator-angle-div";
        ddmrr_angle_div.style.display = "none";
        document.body.appendChild(ddmrr_angle_div);
        resizer.showHideResizer = function (isHide, resizerHandle) {
          if (that.target?.isLocked) {
            isHide = false;
          }
          let borderArr = resizer.querySelectorAll("*") as unknown as Array<
            ResizerBorderDiv | ResizerDiv
          >;
          borderArr.forEach((x) => {
            x !== resizerHandle && (x.style.opacity = isHide ? "0" : "1");
          });
        };

        let showAngleValue = (x: number, y: number, angle: number) => {
          ddmrr_angle_div.style.display = "";
          ddmrr_angle_div.style.left = x + "px";
          ddmrr_angle_div.style.top = y + "px";
          ddmrr_angle_div.innerHTML = angle + "";
        };
        let hideAngleValue = () => {
          ddmrr_angle_div.style.display = "none";
        };
        let rotateXY = (
          cx: number,
          cy: number,
          x: number,
          y: number,
          angle: number,
        ) => {
          let radians = (Math.PI / 180) * angle,
            cos = Math.cos(radians),
            sin = Math.sin(radians),
            nx = cos * (x - cx) + sin * (y - cy) + cx,
            ny = cos * (y - cy) - sin * (x - cx) + cy;
          return { x: nx, y: ny };
        };
        let getCoordinates = (size: Size, angle: number) => {
          /*
								  a(x,y) _____________________________  b(x,y)
										|                             |
										|                             |
										|                             |
										|                             |
								  d(x,y)|_____________________________| c(x,y)
						 */

          let radians = (Math.PI / -180) * angle;
          let cos = Math.cos(radians);
          let sin = Math.sin(radians);
          let x1 = size.left;
          let y1 = size.top;
          let x2 = x1 + size.width;
          let y2 = y1;
          let x3 = x1 + size.width;
          let y3 = y1 + size.height;
          let x4 = x1;
          let y4 = y1 + size.height;
          let px = x1 + size.width / 2;
          let py = y1 + size.height / 2;
          // console.table({ angle, radians, cos, sin, x1, y1, x2, y2, x3, y3, x4, y4, px, py });

          let ax = cos * (x1 - px) + sin * (y1 - py) + px;
          let ay = cos * (y1 - py) - sin * (x1 - px) + py;

          let bx = cos * (x2 - px) + sin * (y2 - py) + px;
          let by = cos * (y2 - py) - sin * (x2 - px) + py;

          let cx = cos * (x3 - px) + sin * (y3 - py) + px;
          let cy = cos * (y3 - py) - sin * (x3 - px) + py;

          let dx = cos * (x4 - px) + sin * (y4 - py) + px;
          let dy = cos * (y4 - py) - sin * (x4 - px) + py;

          return { ax, ay, bx, by, cx, cy, dx, dy, px, py };
        };

        let adjustRotateDiv = (
          size: Size,
          oldSize: Size,
          angle: number,
          fixToPos: FixPos,
        ) => {
          let s1 = getCoordinates(oldSize, angle);
          let s2 = getCoordinates(size, angle);
          // console.log('--------------------');
          // console.log('oldSize:=', oldSize);
          // console.log('s1:=', s1);
          // console.log('newSize:=', size);
          // console.log('s2:=', s2);

          let newX = 0;
          let newY = 0;

          switch (fixToPos) {
            case 1:
            case "TopLeft":
              newX = size.left + s1.ax - s2.ax;
              newY = size.top + s1.ay - s2.ay;
              break;
            case 2:
            case "TopRight":
              newX = size.left + s1.bx - s2.bx;
              newY = size.top + s1.by - s2.by;
              break;
            case 3:
            case "BottomRight":
              newX = size.left + s1.cx - s2.cx;
              newY = size.top + s1.cy - s2.cy;
              break;
            case 4:
            case "BottomLeft":
              newX = size.left + s1.dx - s2.dx;
              newY = size.top + s1.dy - s2.dy;
              break;
            default:
              newX = size.left + s1.ax - s2.ax;
              newY = size.top + s1.ay - s2.ay;
              break;
          }
          return {
            x: newX,
            y: newY,
          };
        };
        let handleMousedown = (e: MouseOrTouchEvent) => {
          if (e.type === "mousedown") {
            e.preventDefault();
          }
          e.stopPropagation();
          let target = this.target;
          if (!target) return;
          target.isLocked = target.getAttribute("islocked") === "true";
          if (!target.isLocked) {
            window.addEventListener("mousemove", handleMousemove);
            window.addEventListener("mouseup", handleMouseup);
            window.addEventListener("touchmove", handleMousemove);
            window.addEventListener("touchend", handleMouseup);
          }
          resizer.current = e.target;
          moveCounter = 0;

          resizer.current.classList.add("active");
          if (e instanceof MouseEvent) {
            resizer.startPos = {
              x: e.clientX + document.body.scrollLeft,
              y: e.clientY + document.body.scrollTop,
            };
          }
          target.size = {
            left: target.offsetLeft,
            top: target.offsetTop,
            width: target.offsetWidth,
            height: target.offsetHeight,
            cx: target.offsetLeft + target.offsetWidth / 2,
            cy: target.offsetTop + target.offsetHeight / 2,
          };

          if (e.type === "touchstart" && e instanceof TouchEvent) {
            if (e.touches.length > 1) {
              return;
            }
            resizer.startPos = {
              x: e.touches[0].clientX + document.body.scrollLeft,
              y: e.touches[0].clientY + document.body.scrollTop,
            };
          }
          target.bBox = target.getBoundingClientRect();
          if (target.angle) {
            let bBox = target.bBox;
            let cx = bBox.left + bBox.width / 2;
            let cy = bBox.top + bBox.height / 2;
            resizer.startPos = rotateXY(
              cx,
              cy,
              resizer.startPos.x,
              resizer.startPos.y,
              target.angle,
            );
          }
          if (
            target.angle &&
            target.options &&
            !target.options.resizeFromCenter
          ) {
            let coord = getCoordinates(target.size, target.angle);
            target.coord = coord;
            switch (resizer.current.actionName) {
              case "se-resizer":
              case "e-resizer":
              case "s-resizer":
                // toFixPos = 'TopLeft';
                resizer.style.transformOrigin = "top left";
                target.style.transformOrigin = "top left";
                target.style.left = coord.ax + "px";
                target.style.top = coord.ay + "px";
                break;
              case "sw-resizer":
              case "w-resizer":
                // toFixPos = 'TopRight';
                resizer.style.transformOrigin = "top right";
                target.style.transformOrigin = "top right";
                target.style.left = coord.bx - target.size.width + "px";
                target.style.top = coord.by + "px";
                break;
              case "ne-resizer":
                // toFixPos = 'BottomLeft';
                resizer.style.transformOrigin = "bottom left";
                target.style.transformOrigin = "bottom left";
                target.style.left = coord.dx + "px";
                target.style.top = coord.dy - target.size.height + "px";
                break;
              case "nw-resizer":
              case "n-resizer":
                // toFixPos = 'BottomRight';
                resizer.style.transformOrigin = "bottom right";
                target.style.transformOrigin = "bottom right";
                target.style.left = coord.cx - target.size.width + "px";
                target.style.top = coord.cy - target.size.height + "px";
                break;
              default:
                break;
            }
          }
          this.show(target);
          let handleClick = (e: MouseOrTouchEvent) => {
            e.stopPropagation();
            e.preventDefault();
            window.removeEventListener("click", handleClick, true);
          };
          window.addEventListener("click", handleClick, true);
          if (resizer.showHideResizer) {
            resizer.showHideResizer(true, resizer.current);
          }
        };
        let handleMousemove = (event: MouseOrTouchEvent) => {
          let e = event as CallbackEvent;
          e.stopPropagation();
          e.type === "mousemove" && e.preventDefault();
          let target = this.target as unknown as ResizerTargetElement;
          let resizer = this.resizer;
          if (!target.options) {
            throw new Error(`Can't find target options.`);
          }
          let resizeFromCenter = target.options.resizeFromCenter;
          let { minWidth, minHeight, aspectRatio, maxWidth, maxHeight } =
            target.options;
          let X: number | undefined = undefined;
          let Y: number | undefined = undefined;
          let x: number | undefined = undefined;
          let y: number | undefined = undefined;
          if (e instanceof MouseEvent && resizer) {
            X = e.clientX + document.body.scrollLeft;
            Y = e.clientY + document.body.scrollTop;
            x = e.clientX + document.body.scrollLeft - resizer.startPos.x;
            y = e.clientY + document.body.scrollTop - resizer.startPos.y;
          }
          let left = target.size.left;
          let top = target.size.top;
          let width = target.size.width;
          let height = target.size.height;
          let bBox = target.bBox;
          let cx = bBox.left + bBox.width / 2;
          let cy = bBox.top + bBox.height / 2;
          let angle = target.angle;
          if (moveCounter === 0) {
            if (
              this.resizer &&
              this.resizer.current.actionName === "r-resizer"
            ) {
              if (target.options && target.options.onRotateStart) {
                e.size = { ...target.size };
                e.angle = target.angle;
                e.evtTarget = target;
                e.handler = resizer?.current;
                target.options.onRotateStart(e);
              }
            } else {
              if (target.options && target.options.onResizeStart) {
                e.size = { ...target.size };
                e.angle = target.angle;
                e.evtTarget = target;
                e.handler = resizer?.current;
                target.options.onResizeStart(e);
              }
            }
          }
          moveCounter++;

          if (e.type === "touchmove" && e instanceof TouchEvent && resizer) {
            x =
              e.touches[0].clientX +
              document.body.scrollLeft -
              resizer.startPos.x;
            y =
              e.touches[0].clientY +
              document.body.scrollTop -
              resizer.startPos.y;
            X = e.touches[0].clientX + document.body.scrollLeft;
            Y = e.touches[0].clientY + document.body.scrollTop;
          }
          if (angle && X !== undefined && Y !== undefined && resizer) {
            let cx = bBox.left + bBox.width / 2;
            let cy = bBox.top + bBox.height / 2;
            let newXY = rotateXY(cx, cy, X, Y, angle);
            x = newXY.x - resizer.startPos.x;
            y = newXY.y - resizer.startPos.y;
          }

          if (resizeFromCenter && x !== undefined && y !== undefined) {
            x = x * 2;
            y = y * 2;
          }
          if (this.resizer) {
            switch (this.resizer.current.actionName) {
              case "se-resizer":
                {
                  if (x === undefined || y === undefined) return;
                  width = target.size.width + x / target.scale;
                  height = target.size.height + y / target.scale;
                  if (width < minWidth) {
                    width = minWidth;
                  }
                  if (width > maxWidth) {
                    width = maxWidth;
                  }
                  if (height < minHeight) {
                    height = minHeight;
                  }
                  if (height > maxHeight) {
                    height = maxHeight;
                  }
                  if (aspectRatio) {
                    let hr = target.size.height / target.size.width;
                    height = width * hr;
                    if (height < minHeight || height > maxHeight) {
                      height = minHeight;
                      let wr = target.size.width / target.size.height;
                      width = height * wr;
                    }
                  }
                }
                break;
              case "sw-resizer":
                {
                  if (x === undefined || y === undefined) return;
                  width = target.size.width - x / target.scale;
                  height = target.size.height + y / target.scale;
                  if (width < minWidth) {
                    width = minWidth;
                  }
                  if (width > maxWidth) {
                    width = maxWidth;
                  }
                  if (height < minHeight) {
                    height = minHeight;
                  }
                  if (height > maxHeight) {
                    height = maxHeight;
                  }
                  if (aspectRatio) {
                    let hr = target.size.height / target.size.width;
                    height = width * hr;
                  }
                  left = left + target.size.width - width;
                }
                break;
              case "ne-resizer":
                {
                  if (x === undefined || y === undefined) return;
                  width = target.size.width + x / target.scale;
                  height = target.size.height - y / target.scale;
                  if (width < minWidth) {
                    width = minWidth;
                  }
                  if (width > maxWidth) {
                    width = maxWidth;
                  }
                  if (height < minHeight) {
                    height = minHeight;
                  }
                  if (height > maxHeight) {
                    height = maxHeight;
                  }
                  if (aspectRatio) {
                    let hr = target.size.height / target.size.width;
                    height = width * hr;
                  }
                  top = top + target.size.height - height;
                }
                break;
              case "nw-resizer":
                {
                  if (x === undefined || y === undefined) return;
                  width = target.size.width - x / target.scale;
                  height = target.size.height - y / target.scale;
                  if (width < minWidth) {
                    width = minWidth;
                  }
                  if (width > maxWidth) {
                    width = maxWidth;
                  }
                  if (height < minHeight) {
                    height = minHeight;
                  }
                  if (height > maxHeight) {
                    height = maxHeight;
                  }
                  if (aspectRatio) {
                    let hr = target.size.height / target.size.width;
                    height = width * hr;
                  }
                  top = top + target.size.height - height;
                  left = left + target.size.width - width;
                }
                break;
              case "n-resizer":
                {
                  if (y === undefined) return;
                  height = target.size.height - y / target.scale;
                  if (height < minHeight) {
                    height = minHeight;
                  }
                  if (height > maxHeight) {
                    height = maxHeight;
                  }
                  top = top + target.size.height - height;
                }
                break;
              case "e-resizer":
                {
                  if (x === undefined) return;
                  width = target.size.width + x / target.scale;
                  if (width < minWidth) {
                    width = minWidth;
                  }
                  if (width > maxWidth) {
                    width = maxWidth;
                  }
                }
                break;
              case "s-resizer":
                {
                  if (y === undefined) return;
                  height = target.size.height + y / target.scale;
                  if (height < minHeight) {
                    height = minHeight;
                  }

                  if (height > maxHeight) {
                    height = maxHeight;
                  }
                }
                break;
              case "w-resizer":
                {
                  if (x === undefined) return;
                  width = target.size.width - x / target.scale;
                  if (width < minWidth) {
                    width = minWidth;
                  }
                  if (width > maxWidth) {
                    width = maxWidth;
                  }
                  left = left + target.size.width - width;
                }
                break;
              case "r-resizer":
                {
                  if (X === undefined || Y === undefined) return;
                  angle = Math.atan2(X - cx, -(Y - cy)) * (180 / Math.PI) - 180;
                  angle = angle >= 0 ? angle : 360 + angle;
                  target.angle = angle;
                  if (target.style.transform.indexOf("rotate") >= 0) {
                    target.style.transform = target.style.transform.replace(
                      /rotate\(\w*\)/gi,
                      "rotate(" + angle + "deg)",
                    );
                  } else {
                    target.style.transform += " rotate(" + angle + "deg)";
                  }
                  showAngleValue(X, Y, angle);
                }
                break;
              default:
                break;
            }
            if (
              target.angle &&
              this.resizer.current.actionName !== "r-resizer" &&
              !resizeFromCenter
            ) {
              let toFixPos = "TopLeft";
              switch (this.resizer.current.actionName) {
                case "se-resizer":
                case "e-resizer":
                case "s-resizer":
                  // toFixPos = 'TopLeft';
                  left = target.coord.ax;
                  top = target.coord.ay;
                  break;
                case "sw-resizer":
                case "w-resizer":
                  // toFixPos = 'TopRight';
                  left = target.coord.bx - width;
                  top = target.coord.by;
                  // let s1 = getCoordinates({ left, top, width, height }, 0)
                  break;
                case "ne-resizer":
                  // toFixPos = 'BottomLeft';
                  left = target.coord.dx;
                  top = target.coord.dy - height;
                  break;
                case "nw-resizer":
                case "n-resizer":
                  // toFixPos = 'BottomRight';
                  left = target.coord.cx - width;
                  top = target.coord.cy - height;
                  break;
                default:
                  break;
              }
            }
          }

          if (resizeFromCenter) {
            if (target.size.cx === undefined || target.size.cy === undefined)
              return;
            left = target.size.cx - width / 2;
            top = target.size.cy - height / 2;
          }
          let newSize = { left, top, width, height };
          target.newSize = newSize;
          target.style.left = left + "px";
          target.style.top = top + "px";
          target.style.width = width + "px";
          target.style.height = height + "px";
          //trigger onResizing Event
          if (this.resizer && this.resizer.current.actionName === "r-resizer") {
            if (target.options && target.options.onRotating) {
              e.size = { ...target.newSize };
              e.angle = target.angle;
              e.evtTarget = target;
              e.handler = resizer?.current;
              target.options.onRotating(e);
            }
          } else {
            if (target.options && target.options.onResizing) {
              e.size = { ...target.newSize };
              e.angle = target.angle;
              e.evtTarget = target;
              e.handler = resizer?.current;
              target.options.onResizing(e);
            }
          }
          this.show(target);
        };
        let handleMouseup = (event: MouseOrTouchEvent) => {
          let e = event as CallbackEvent;
          e.stopPropagation();
          e.type === "mouseup" && e.preventDefault();
          window.removeEventListener("mousemove", handleMousemove);
          window.removeEventListener("mouseup", handleMouseup);
          window.removeEventListener("touchmove", handleMousemove);
          window.removeEventListener("touchend", handleMouseup);
          hideAngleValue();
          if (resizer && resizer.showHideResizer) {
            resizer.showHideResizer(false, resizer.current);
          }
          let target = this.target;
          let resizeFromCenter = target?.options?.resizeFromCenter;
          if (
            target &&
            target.angle &&
            resizer.current.actionName !== "r-resizer" &&
            !resizeFromCenter &&
            this.resizer
          ) {
            let toFixPos: FixPos = "TopLeft";
            resizer.style.transformOrigin = "";
            target.style.transformOrigin = "";
            let newSize;
            let adj;
            switch (this.resizer.current.actionName) {
              case "se-resizer":
                toFixPos = "TopLeft";
                break;
              case "sw-resizer":
                toFixPos = "TopRight";
                break;
              case "ne-resizer":
                toFixPos = "BottomLeft";
                break;
              case "nw-resizer":
                toFixPos = "BottomRight";
                break;
              case "n-resizer":
                toFixPos = "BottomRight";
                break;
              case "e-resizer":
                toFixPos = "TopLeft";
                break;
              case "s-resizer":
                toFixPos = "TopLeft";
                break;
              case "w-resizer":
                toFixPos = "TopRight";
                break;
              default:
                break;
            }
            newSize = {
              left: target.size.left,
              top: target.size.top,
              width: target.newSize.width,
              height: target.newSize.height,
            };
            adj = adjustRotateDiv(newSize, target.size, target.angle, toFixPos);
            target.style.left = adj.x + "px";
            target.style.top = adj.y + "px";
            target.newSize = { ...newSize, left: adj.x, top: adj.y };
          }
          if (moveCounter) {
            if (resizer.current.actionName === "r-resizer" && target) {
              if (target.options && target.options.onRotateEnd) {
                e.size = { ...target.newSize };
                e.angle = target.angle;
                e.evtTarget = target;
                e.handler = resizer.current;
                target.options.onRotateEnd(e);
              }
            } else {
              if (target && target.options && target.options.onResizeEnd) {
                e.size = { ...target.newSize };
                e.angle = target.angle;
                e.evtTarget = target;
                e.handler = resizer.current;
                target.options.onResizeEnd(e);
              }
            }
          }
          resizer.current.classList.remove("active");
          if (target) {
            this.show(target);
          }
        };
        let moveCounter = 0;
        resizer.removeEventListener("mousedown", handleMousedown);
        resizer.addEventListener("mousedown", handleMousedown);
        resizer.removeEventListener("touchstart", handleMousedown);
        resizer.addEventListener("touchstart", handleMousedown);

        let onWindowResize = (e: UIEvent) => {
          if (resizer.visibile && this.target) {
            this.show(this.target);
          }
        };
        window.removeEventListener("resize", onWindowResize, true);
        window.addEventListener("resize", onWindowResize, true);
        let scrollHandler = (e: Event) => {
          if (resizer.visibile && this.target) {
            this.show(this.target);
          }
        };
        window.removeEventListener("scroll", scrollHandler, true);
        window.addEventListener("scroll", scrollHandler, true);
      }
      let resizer = this.resizer;
      let getBorderBox = (target: ResizerTargetElement) => {
        let _target = resizer._target;
        if (!_target) {
          _target = target.cloneNode() as ResizerTargetElement;
          _target.innerHTML = "";
          if (target.parentNode) {
            target.parentNode.appendChild(_target);
          }
          resizer._target = _target;
        }
        _target.style.cssText = target.style.cssText;
        _target.style.opacity = "0";
        _target.style.pointerEvents = "none";
        let transform = _target.style.transform;
        if (transform && transform.indexOf("rotate") >= 0) {
          _target.style.transform = transform.replace(/rotate\(\w*\)/gi, "");
        } else if (target.angle) {
          _target.style.transform = transform + " rotate(0deg)";
        }
        _target.timeOut && clearTimeout(_target.timeOut);
        _target.timeOut = setTimeout(() => {
          if (_target) {
            _target.timeOut = null;
            _target.remove();
          }
          if (resizer) {
            resizer._target = undefined;
          }
        }, 1000);

        return target.getBoundingClientRect();
      };
      let updateResizerCursor = (angle: number) => {
        if (this.resizer && angle != this.resizer.angle) {
          let a = (angle + 7) % 15;
          let d = (angle - a + 7) % 180;
          let resizer = this.resizer;
          resizer.angle = angle;

          resizer.ne_resizer.className =
            resizer.ne_resizer.className.replace(/ cursor_(\d)+d/gi, "") +
            " cursor_" +
            ((d + 45) % 180) +
            "d";
          resizer.sw_resizer.className =
            resizer.sw_resizer.className.replace(/ cursor_(\d)+d/gi, "") +
            " cursor_" +
            ((d + 45) % 180) +
            "d";
          resizer.nw_resizer.className =
            resizer.nw_resizer.className.replace(/ cursor_(\d)+d/gi, "") +
            " cursor_" +
            ((d + 135) % 180) +
            "d";
          resizer.se_resizer.className =
            resizer.se_resizer.className.replace(/ cursor_(\d)+d/gi, "") +
            " cursor_" +
            ((d + 135) % 180) +
            "d";
          resizer.n_resizer.className =
            resizer.n_resizer.className.replace(/ cursor_(\d)+d/gi, "") +
            " cursor_" +
            ((d + 0) % 180) +
            "d";
          resizer.s_resizer.className =
            resizer.s_resizer.className.replace(/ cursor_(\d)+d/gi, "") +
            " cursor_" +
            ((d + 0) % 180) +
            "d";
          resizer.w_resizer.className =
            resizer.w_resizer.className.replace(/ cursor_(\d)+d/gi, "") +
            " cursor_" +
            ((d + 90) % 180) +
            "d";
          resizer.e_resizer.className =
            resizer.e_resizer.className.replace(/ cursor_(\d)+d/gi, "") +
            " cursor_" +
            ((d + 90) % 180) +
            "d";
        }
      };
      // if (!resizer.visibile) {
      let resizers = target.options && target.options.resizers;
      if (resizers) {
        resizer.nw_resizer.style.display = resizers.nw ? "" : "none";
        resizer.ne_resizer.style.display = resizers.ne ? "" : "none";
        resizer.sw_resizer.style.display = resizers.sw ? "" : "none";
        resizer.se_resizer.style.display = resizers.se ? "" : "none";
        resizer.n_resizer.style.display = resizers.n ? "" : "none";
        resizer.e_resizer.style.display = resizers.e ? "" : "none";
        resizer.s_resizer.style.display = resizers.s ? "" : "none";
        resizer.w_resizer.style.display = resizers.w ? "" : "none";
        resizer.r_resizer.style.display = resizers.r ? "" : "none";
      }
      // }

      let bBox = getBorderBox(target);
      resizer.style.left = bBox.left + window.scrollX + "px";
      resizer.style.top = bBox.top + window.scrollY + "px";
      resizer.style.width = bBox.width + 1 + "px";
      resizer.style.height = bBox.height + 1 + "px";
      resizer.style.display = "";
      resizer.style.transform = "rotate(" + (target.angle || 0) + "deg)";
      resizer.visibile = true;
      resizer.target = target;

      updateResizerCursor(target.angle);

      return bBox;
    }
    return target.getBoundingClientRect();
  },
  hide() {
    this.target = null;
    if (this.resizer) {
      this.resizer.style.display = "none";
      this.resizer.visibile = false;
    }
  },
  remove(target: ResizerTargetElement) {
    if (target && target.handleMousedown) {
      target.removeEventListener("mousedown", target.handleMousedown);
      target.removeEventListener("touchstart", target.handleMousedown);
      target.removeEventListener("mouseenter", target.handleMouseEnter);
      target.removeEventListener("mouseleave", target.handleMouseLeave);
      if (target.options) {
        target.options = null;
      }
      target.resizer = null;
      this.hide();
    }
  },
  setParent(el: HTMLElement) {
    this.parentBounding = el.getBoundingClientRect();
  },
};
export default resizer;
