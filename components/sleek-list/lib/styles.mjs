const staticStyle = new CSSStyleSheet();

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
        display: flex;
        flex-direction: column;
        height: 80000px;
    }
    
    #heading {
        position: sticky;
        top: 0;
    }
    
    #heading {
        background-color: white;
        color: blue;
    }
    
    #top.filler {
        background-color: lightskyblue;
        color: white;
        height: 0;
    }

    #bottom.filler {
        background-color: pink;
        color: white;
        flex: 1 1 0;
    }

   .item {
        background-color: salmon;
        color: black;
        margin: 2px;
        border: 2px solid brown;
        padding: 50px;
    }
 
`);


export default staticStyle;
