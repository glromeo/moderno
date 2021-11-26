import {css} from "lit-element";

import Scrollbar from "smooth-scrollbar";

export const isWin64 = navigator.appVersion.indexOf("Windows") > 0;

export const smoothScrollbarStyle = isWin64 ? css`
    [data-scrollbar] {
      display: block;
      position: relative;
    }
    
    .scroll-content {
      -webkit-transform: translate3d(0, 0, 0);
              transform: translate3d(0, 0, 0);
    }
    
    .scrollbar-track {
      position: absolute;
      opacity: 0;
      z-index: 1;
      background: rgba(222, 222, 222, .5);
      -webkit-user-select: none;
         -moz-user-select: none;
          -ms-user-select: none;
              user-select: none;
      -webkit-transition: opacity 0.5s 0.5s ease-out;
              transition: opacity 0.5s 0.5s ease-out;
    }
    .scrollbar-track.show,
    .scrollbar-track:hover {
      opacity: 1;
      -webkit-transition-delay: 0s;
              transition-delay: 0s;
    }
    
    .scrollbar-track-x {
      bottom: 0;
      left: 0;
      width: 100%;
      height: 8px;
    }
    .scrollbar-track-y {
      top: 0;
      right: 0;
      width: 8px;
      height: 100%;
    }
    .scrollbar-thumb {
      position: absolute;
      top: 0;
      left: 0;
      width: 6px;
      height: 6px;
      background: hsla(210,50%,50%,.66);
      border-radius: .25rem;
    }
    .scrollbar-thumb.scrollbar-thumb-x {
      top: 1px;
    }
    .scrollbar-thumb.scrollbar-thumb-y {
      left: 1px;
    }
` : css``;

export const smoothScrollbar = isWin64
    ? element => Scrollbar.init(element, {
        damping: 0.1,
        thumbMinSize: 15,
        renderByPixels: false,
        alwaysShowTracks: false,
        continuousScrolling: false
    })
    : () => undefined;

export const colors = new Map([
    ["aliceblue", {text: "AliceBlue", value: "#F0F8FF"}],
    ["antiquewhite", {text: "AntiqueWhite", value: "#FAEBD7"}],
    ["aqua", {text: "Aqua", value: "#00FFFF"}],
    ["aquamarine", {text: "Aquamarine", value: "#7FFFD4"}],
    ["azure", {text: "Azure", value: "#F0FFFF"}],
    ["beige", {text: "Beige", value: "#F5F5DC"}],
    ["bisque", {text: "Bisque", value: "#FFE4C4"}],
    ["black", {text: "Black", value: "#000000"}],
    ["blanchedalmond", {text: "BlanchedAlmond", value: "#FFEBCD"}],
    ["blue", {text: "Blue", value: "#0000FF"}],
    ["blueviolet", {text: "BlueViolet", value: "#8A2BE2"}],
    ["brown", {text: "Brown", value: "#A52A2A"}],
    ["burlywood", {text: "BurlyWood", value: "#DEB887"}],
    ["cadetblue", {text: "CadetBlue", value: "#5F9EA0"}],
    ["chartreuse", {text: "Chartreuse", value: "#7FFF00"}],
    ["chocolate", {text: "Chocolate", value: "#D2691E"}],
    ["coral", {text: "Coral", value: "#FF7F50"}],
    ["cornflowerblue", {text: "CornflowerBlue", value: "#6495ED"}],
    ["cornsilk", {text: "Cornsilk", value: "#FFF8DC"}],
    ["crimson", {text: "Crimson", value: "#DC143C"}],
    ["cyan", {text: "Cyan", value: "#00FFFF"}],
    ["darkblue", {text: "DarkBlue", value: "#00008B"}],
    ["darkcyan", {text: "DarkCyan", value: "#008B8B"}],
    ["darkgoldenrod", {text: "DarkGoldenRod", value: "#B8860B"}],
    ["darkgray", {text: "DarkGray", value: "#A9A9A9"}],
    ["darkgrey", {text: "DarkGrey", value: "#A9A9A9"}],
    ["darkgreen", {text: "DarkGreen", value: "#006400"}],
    ["darkkhaki", {text: "DarkKhaki", value: "#BDB76B"}],
    ["darkmagenta", {text: "DarkMagenta", value: "#8B008B"}],
    ["darkolivegreen", {text: "DarkOliveGreen", value: "#556B2F"}],
    ["darkorange", {text: "DarkOrange", value: "#FF8C00"}],
    ["darkorchid", {text: "DarkOrchid", value: "#9932CC"}],
    ["darkred", {text: "DarkRed", value: "#8B0000"}],
    ["darksalmon", {text: "DarkSalmon", value: "#E9967A"}],
    ["darkseagreen", {text: "DarkSeaGreen", value: "#8FBC8F"}],
    ["darkslateblue", {text: "DarkSlateBlue", value: "#483D8B"}],
    ["darkslategray", {text: "DarkSlateGray", value: "#2F4F4F"}],
    ["darkslategrey", {text: "DarkSlateGrey", value: "#2F4F4F"}],
    ["darkturquoise", {text: "DarkTurquoise", value: "#00CED1"}],
    ["darkviolet", {text: "DarkViolet", value: "#9400D3"}],
    ["deeppink", {text: "DeepPink", value: "#FF1493"}],
    ["deepskyblue", {text: "DeepSkyBlue", value: "#00BFFF"}],
    ["dimgray", {text: "DimGray", value: "#696969"}],
    ["dimgrey", {text: "DimGrey", value: "#696969"}],
    ["dodgerblue", {text: "DodgerBlue", value: "#1E90FF"}],
    ["firebrick", {text: "FireBrick", value: "#B22222"}],
    ["floralwhite", {text: "FloralWhite", value: "#FFFAF0"}],
    ["forestgreen", {text: "ForestGreen", value: "#228B22"}],
    ["fuchsia", {text: "Fuchsia", value: "#FF00FF"}],
    ["gainsboro", {text: "Gainsboro", value: "#DCDCDC"}],
    ["ghostwhite", {text: "GhostWhite", value: "#F8F8FF"}],
    ["gold", {text: "Gold", value: "#FFD700"}],
    ["goldenrod", {text: "GoldenRod", value: "#DAA520"}],
    ["gray", {text: "Gray", value: "#808080"}],
    ["grey", {text: "Grey", value: "#808080"}],
    ["green", {text: "Green", value: "#008000"}],
    ["greenyellow", {text: "GreenYellow", value: "#ADFF2F"}],
    ["honeydew", {text: "HoneyDew", value: "#F0FFF0"}],
    ["hotpink", {text: "HotPink", value: "#FF69B4"}],
    ["indianred", {text: "IndianRed", value: "#CD5C5C"}],
    ["indigo", {text: "Indigo", value: "#4B0082"}],
    ["ivory", {text: "Ivory", value: "#FFFFF0"}],
    ["khaki", {text: "Khaki", value: "#F0E68C"}],
    ["lavender", {text: "Lavender", value: "#E6E6FA"}],
    ["lavenderblush", {text: "LavenderBlush", value: "#FFF0F5"}],
    ["lawngreen", {text: "LawnGreen", value: "#7CFC00"}],
    ["lemonchiffon", {text: "LemonChiffon", value: "#FFFACD"}],
    ["lightblue", {text: "LightBlue", value: "#ADD8E6"}],
    ["lightcoral", {text: "LightCoral", value: "#F08080"}],
    ["lightcyan", {text: "LightCyan", value: "#E0FFFF"}],
    ["lightgoldenrodyellow", {text: "LightGoldenRodYellow", value: "#FAFAD2"}],
    ["lightgray", {text: "LightGray", value: "#D3D3D3"}],
    ["lightgrey", {text: "LightGrey", value: "#D3D3D3"}],
    ["lightgreen", {text: "LightGreen", value: "#90EE90"}],
    ["lightpink", {text: "LightPink", value: "#FFB6C1"}],
    ["lightsalmon", {text: "LightSalmon", value: "#FFA07A"}],
    ["lightseagreen", {text: "LightSeaGreen", value: "#20B2AA"}],
    ["lightskyblue", {text: "LightSkyBlue", value: "#87CEFA"}],
    ["lightslategray", {text: "LightSlateGray", value: "#778899"}],
    ["lightslategrey", {text: "LightSlateGrey", value: "#778899"}],
    ["lightsteelblue", {text: "LightSteelBlue", value: "#B0C4DE"}],
    ["lightyellow", {text: "LightYellow", value: "#FFFFE0"}],
    ["lime", {text: "Lime", value: "#00FF00"}],
    ["limegreen", {text: "LimeGreen", value: "#32CD32"}],
    ["linen", {text: "Linen", value: "#FAF0E6"}],
    ["magenta", {text: "Magenta", value: "#FF00FF"}],
    ["maroon", {text: "Maroon", value: "#800000"}],
    ["mediumaquamarine", {text: "MediumAquaMarine", value: "#66CDAA"}],
    ["mediumblue", {text: "MediumBlue", value: "#0000CD"}],
    ["mediumorchid", {text: "MediumOrchid", value: "#BA55D3"}],
    ["mediumpurple", {text: "MediumPurple", value: "#9370DB"}],
    ["mediumseagreen", {text: "MediumSeaGreen", value: "#3CB371"}],
    ["mediumslateblue", {text: "MediumSlateBlue", value: "#7B68EE"}],
    ["mediumspringgreen", {text: "MediumSpringGreen", value: "#00FA9A"}],
    ["mediumturquoise", {text: "MediumTurquoise", value: "#48D1CC"}],
    ["mediumvioletred", {text: "MediumVioletRed", value: "#C71585"}],
    ["midnightblue", {text: "MidnightBlue", value: "#191970"}],
    ["mintcream", {text: "MintCream", value: "#F5FFFA"}],
    ["mistyrose", {text: "MistyRose", value: "#FFE4E1"}],
    ["moccasin", {text: "Moccasin", value: "#FFE4B5"}],
    ["navajowhite", {text: "NavajoWhite", value: "#FFDEAD"}],
    ["navy", {text: "Navy", value: "#000080"}],
    ["oldlace", {text: "OldLace", value: "#FDF5E6"}],
    ["olive", {text: "Olive", value: "#808000"}],
    ["olivedrab", {text: "OliveDrab", value: "#6B8E23"}],
    ["orange", {text: "Orange", value: "#FFA500"}],
    ["orangered", {text: "OrangeRed", value: "#FF4500"}],
    ["orchid", {text: "Orchid", value: "#DA70D6"}],
    ["palegoldenrod", {text: "PaleGoldenRod", value: "#EEE8AA"}],
    ["palegreen", {text: "PaleGreen", value: "#98FB98"}],
    ["paleturquoise", {text: "PaleTurquoise", value: "#AFEEEE"}],
    ["palevioletred", {text: "PaleVioletRed", value: "#DB7093"}],
    ["papayawhip", {text: "PapayaWhip", value: "#FFEFD5"}],
    ["peachpuff", {text: "PeachPuff", value: "#FFDAB9"}],
    ["peru", {text: "Peru", value: "#CD853F"}],
    ["pink", {text: "Pink", value: "#FFC0CB"}],
    ["plum", {text: "Plum", value: "#DDA0DD"}],
    ["powderblue", {text: "PowderBlue", value: "#B0E0E6"}],
    ["purple", {text: "Purple", value: "#800080"}],
    ["rebeccapurple", {text: "RebeccaPurple", value: "#663399"}],
    ["red", {text: "Red", value: "#FF0000"}],
    ["rosybrown", {text: "RosyBrown", value: "#BC8F8F"}],
    ["royalblue", {text: "RoyalBlue", value: "#4169E1"}],
    ["saddlebrown", {text: "SaddleBrown", value: "#8B4513"}],
    ["salmon", {text: "Salmon", value: "#FA8072"}],
    ["sandybrown", {text: "SandyBrown", value: "#F4A460"}],
    ["seagreen", {text: "SeaGreen", value: "#2E8B57"}],
    ["seashell", {text: "SeaShell", value: "#FFF5EE"}],
    ["sienna", {text: "Sienna", value: "#A0522D"}],
    ["silver", {text: "Silver", value: "#C0C0C0"}],
    ["skyblue", {text: "SkyBlue", value: "#87CEEB"}],
    ["slateblue", {text: "SlateBlue", value: "#6A5ACD"}],
    ["slategray", {text: "SlateGray", value: "#708090"}],
    ["slategrey", {text: "SlateGrey", value: "#708090"}],
    ["snow", {text: "Snow", value: "#FFFAFA"}],
    ["springgreen", {text: "SpringGreen", value: "#00FF7F"}],
    ["steelblue", {text: "SteelBlue", value: "#4682B4"}],
    ["tan", {text: "Tan", value: "#D2B48C"}],
    ["teal", {text: "Teal", value: "#008080"}],
    ["thistle", {text: "Thistle", value: "#D8BFD8"}],
    ["tomato", {text: "Tomato", value: "#FF6347"}],
    ["turquoise", {text: "Turquoise", value: "#40E0D0"}],
    ["violet", {text: "Violet", value: "#EE82EE"}],
    ["wheat", {text: "Wheat", value: "#F5DEB3"}],
    ["white", {text: "White", value: "#FFFFFF"}],
    ["whitesmoke", {text: "WhiteSmoke", value: "#F5F5F5"}],
    ["yellow", {text: "Yellow", value: "#FFFF00"}],
    ["yellowgreen", {text: "YellowGreen", value: "#9ACD32"}]
]);
