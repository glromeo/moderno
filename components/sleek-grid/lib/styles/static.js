export const staticStyle = new CSSStyleSheet();

staticStyle.replaceSync(`

    :host {
        display: contents;
    }
    
    :host(.busy) {
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
    
    #scroll-area {
        position: relative;
    }
    
    #stub {
        position: sticky;
        float: left;
        z-index: 30;
        left: 0;
        top: 0;
        width: 50px;
        height: 32px;
    }
    
    #stub > .overflow {
        display: none;
    }
    
    #stub > .cell {
        width: 100%;
        height: 100%;
    }
    
    #top-header {
        position: sticky;
        top: 0;
        width: calc(100% - 2px);
        z-index: 10;
    }
    
    #top-header > .cell {
        height: 100%;
    }
    
    #left-header {
        position: sticky;
        left: 0;
        z-index: 10;
    }
    
    #left-header > .cell {
        text-align: center;
        width: 100%;
    }
    
    #sheet {
        position: absolute;
    }
    
    .cell {
        position: absolute;
        -webkit-user-select: none;
        user-select: none;
    }
    
    .row {
        display: contents;
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
    
    .handle[column] {
        left: 1px;
        width: 1px;
        margin-left: 2px;
    }
    
    .handle[column]:hover,
    .handle[column].active {
        left: 2px;
        width: 3px;
        margin-left: 0;
    }
    
    .handle[column]::after {
        width: 9px;
        top: 0;
        bottom: 0;
        margin-left: -4px;
        cursor: ew-resize;
    }
    
    .handle[row] {
        left: 0;
        top: 0;
        height: 1px;
    }
    
    .handle[row]:hover,
    .handle[row].active {
        height: 3px;
        top: -1px;
    }
    
    .handle[row]::after {
        height: 9px;
        left: 0;
        right: 0;
        margin-top: -4px;
        cursor: ns-resize;
    }
    
    .cell.hidden {
        opacity: 0;
        width: 0;
        transition: opacity 300ms ease-in-out, width 300ms ease-in-out;
    }
    
`);


