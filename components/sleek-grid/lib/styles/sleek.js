export const sleekStyle = new CSSStyleSheet();

sleekStyle.replaceSync(`
    
    :host {
        --padding: 8px;
        color: var(--text-color)
    }
    
    #view-port {
        background-color: var(--background-color);
    }

    #stub-hide-right {
        position: absolute;
        display: block;
        background-color: var(--background-color);
        top: 0;
        width: 3px;
        box-shadow: 1px -3px 3px var(--background-color);
        border-bottom: 1px solid var(--border-color);
    }
    
    #stub-hide-bottom {
        position: absolute;
        display: block;
        background-color: var(--background-color);
        left: 0;
        height: 3px;
        box-shadow: -3px 1px 3px var(--background-color);
        border-right: 1px solid var(--border-color);
    }

    #stub .handle.hz {
        margin-top: -1px; /* because it's the second float */
    }

    #top-header {
        box-shadow: 1px 0 3px var(--shadow-color);
    }
    
    #left-header {
        box-shadow: 0 1px 3px var(--shadow-color);
    }

    .header {
        background: var(--background-color);
    }
    
    .header .cell :hover,
    .header .cell .active {
        color: var(--border-color-active);
    }

    .handle {
        background-color: var(--border-color);
    }
    
    .handle:hover,
    .handle.active {
        background-color: var(--border-color-active);
    }

    .row.even {
        background-color: var(--even-rows-background);
    }
    
    .row.odd {
        background-color: var(--odd-rows-background);
    }

    .search-input {
        position: absolute;
        bottom: 0;
        width: 100%;
        padding: var(--padding);
        border: none;
        outline: none;
        cursor: text;
        transition: padding 300ms ease;
    }
    
    .search-input:focus,
    .search-input:valid {
        padding-bottom: var(--header-padding);
        transition: padding 300ms ease;
    }
    
    .search-input::-webkit-input-placeholder {
        transition: color 300ms ease;
    }
    
    .search-input:not(:focus)::-webkit-input-placeholder {
        color: transparent;
    }
    
    .search-hr {
        position: absolute;
        width: 100%;
        left: 0;
        bottom: 0;
        margin: -2px 0;
        height: 2px;
        border-bottom: 1px var(--primary-color);
        background: var(--primary-color);
        will-change: transform, visibility;
        transition: all 200ms ease-out;
        transform: scaleX(0);
        visibility: hidden;
        z-index: 1000;
    }
    
    .search-input:focus ~ .search-hr {
        transform: scaleX(1);
        visibility: visible;
    }
    
    .search-label {
        position: absolute;
        bottom: 0;
        transition: bottom 300ms ease;
        padding: var(--padding);
        user-select: text;
    }
    
    .search-input:focus ~ .search-label,
    .search-input:valid ~ .search-label {
        color: var(--primary-color);
        bottom: calc(var(--header-padding) * 2 + .625em);
        transition: bottom 300ms ease;
        font-size: 0.8em;
        user-select: none;
    }
    
    .cell {
        border-right: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
    }
    
    .rh.cell,
    .ch.cell {
        background: var(--background-color);
    }
    
    .cell-text {
        position: relative;
        -webkit-user-select: text;
        user-select: text;
        height: 100%;
        padding: var(--padding);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .cell-content {
        position: relative;
        height: 100%;
    }

    .cell svg {
        height: 1.25em;
    }
    
    .sort-icon {
        position: absolute;
        margin-left: 3px;
        opacity: 0;
        cursor: pointer;
        z-index: 1000;
        user-select: none;
    }
    
    .cell:hover:not([sort]) .sort-icon {
        opacity: .25;
    }
    
    .cell[sort=desc] .sort-icon {
        transform: scaleY(-1);
    }
    
    .cell[sort] .sort-icon {
        opacity: 1;
    }
    
    .search-icon {
        position: absolute;
        bottom: 5px;
        right: 5px;
        opacity: 0;
        cursor: pointer;
    }
    
    .cell:hover .search-icon {
        opacity: .25;
    }
    
    .cell[search] .search-icon {
        opacity: 1;
    }

    .search-input:focus ~ .search-icon,
    .search-input:valid ~ .search-icon {
        opacity: 1;
    }
    
    .rendering * {
        opacity: 1;
        transition: opacity 300ms ease, transform 300ms ease;
    }
    
    .rendering .enter {
        opacity: 0;
        transform: translateY(0);
    }
    .rendering .leave {
        opacity: 0;
        transform: translateX(10000);
        transition: opacity 300ms ease, transform 300ms ease;
    }

    .animate .row {
        transition: transform 300ms ease-in-out;
    }
    
    .cell.hidden {
        width: 0;
        transition: width 300ms ease-in-out;
    }

    .hidden .cell-text {
        opacity: 0;
        transition: opacity 300ms ease-in-out;
    }
`);
