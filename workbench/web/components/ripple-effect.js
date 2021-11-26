/**
 * NOTE:
 * I should limit the disabled semantic to the attribute only...
 * and possibily enforce its detection from the property which must be kept in sync for custom elements
 *
 * @param element
 */
export function canRipple(element) {
    return element && !element.hasAttribute("disabled") && !element.classList.contains("disabled");
}

export function rippleEffect(e, element) {

    element = element || e.target.closest(".ripple-surface");

    if (canRipple(element)) {
        const target = e.target;
        const {left, top, width, height} = element.getBoundingClientRect();
        const x = e.pageX - pageXOffset - left;
        const y = e.pageY - pageYOffset - top;

        const ripple = document.createElement('span');

        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.setProperty('--scale', String(Math.max(width, height)));

        element.insertBefore(ripple, element.firstElementChild);

        element.classList.add("ripple-active");
        if (target instanceof Element) {
            target.classList.add("ripple-target");
        }

        return new Promise(done => {
            setTimeout(done, 500); // todo: hook on the animation end
        }).then(()=> {
            const parentNode = ripple.parentNode;
            if (parentNode) {
                if (target instanceof Element) {
                    target.classList.remove("ripple-target");
                }
                parentNode.classList.remove("ripple-active");
                parentNode.removeChild(ripple);
            }
        });
    }
}
