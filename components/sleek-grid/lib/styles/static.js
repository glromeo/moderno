export const staticStyle = new CSSStyleSheet();

staticStyle.replaceSync(`

    :host {
        --header-width: 50px;
        --header-height: 32px;
        --sheet-width: auto;
        --sheet-height: auto;
        display: contents;
    }
    
    :host(.busy) *,
    :host(.busy) *::after {
        cursor: progress !important;
    }
    
    * {
        box-sizing: border-box;
    }
    
    #view-port {
        width: 100%;
        height: 100%;
        overflow: auto;
    }
    
    #stub {
        position: sticky;
        float: left;
        z-index: 30;
        left: 0;
        top: 0;
        width: var(--header-width);
        height: var(--header-height);
    }
    
    #stub-hide-left,
    #stub-hide-right {
        display: none;
    }
    
    #stub > .cell {
        width: 100%;
        height: 100%;
    }
    
    #stub-hide-right {
        left: var(--header-width);
        height: var(--header-height);
    }
    
    #stub-hide-bottom {
        top: var(--header-height);
        width: var(--header-width);
    }
    
    #scroll-area {
        position: relative;
        width: var(--sheet-width);
        height: var(--sheet-height);
    }
    
    #top-header {
        position: sticky;
        top: 0;
        z-index: 10;
        margin-left: var(--header-width);
        width: var(--sheet-width);
        height: var(--header-height);
    }
    
    .ch {
        
    }
    
    #left-header {
        position: sticky;
        float: left;
        left: 0;
        width: var(--header-width);
        height: var(--sheet-height);
        z-index: 10;
    }
    
    .rh {
        text-align: center;
        width: 100%;
    }
    
    #sheet{
        position: absolute;
        left: var(--header-width);
    }
    
    .cell {
        display: inline-block;
        position: absolute;
        -webkit-user-select: none;
        user-select: none;
        height: 100%;
    }
    
    .row {
        position: absolute;
        white-space: nowrap;
        width: var(--sheet-width);
    }
    
    .handle {
        float: right;
        z-index: 100;
        position: relative;
    }
    
    .handle::after {
        content: "";
        position: absolute;
        background-color: transparent;
        z-index: 200;
    }
    
    .width-handle {
        left: 1px;
        width: 1px;
        height: 100%;
        margin-left: 2px;
    }
    
    .width-handle:hover,
    .width-handle.active {
        left: 2px;
        width: 3px;
        margin-left: 0;
    }
    
    .width-handle::after {
        width: 9px;
        top: 0;
        bottom: 0;
        margin-left: -4px;
        cursor: ew-resize;
    }
    
    .height-handle {
        left: 0;
        top: 0;
        height: 1px;
        width: 100%;
    }
    
    .height-handle:hover,
    .height-handle.active {
        height: 3px;
        top: -1px;
    }
    
    .height-handle::after {
        height: 9px;
        left: 0;
        right: 0;
        margin-top: -4px;
        cursor: ns-resize;
    }
    
`);


