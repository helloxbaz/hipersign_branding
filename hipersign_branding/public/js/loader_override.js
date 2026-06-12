(function () {
    const replaceLoader = () => {
        const splash = document.querySelector('.splash');
        if (!splash) return;

        splash.innerHTML = `
            <div style="
                width:120px;
                height:120px;
                background:url('/assets/hipersign_branding/images/hipersign-loader.png') no-repeat center;
                background-size:contain;
            "></div>
        `;
    };

    // run immediately
    replaceLoader();

    // run again just in case
    document.addEventListener("DOMContentLoaded", replaceLoader);
})();
