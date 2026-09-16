import "./division/sheet.js";
import "./division/school.js";

import "./division/sheet.js";
import "./division/school.js";

function switchTab(tabName) {
    document.getElementById(
        "contentSheet"
    ).style.display = "none";

    document.getElementById(
        "contentSchools"
    ).style.display = "none";

    document.getElementById(
        "btnSheet"
    ).classList.remove("active");

    document.getElementById(
        "btnSchools"
    ).classList.remove("active");

    if (tabName === "sheet") {
        document.getElementById(
            "contentSheet"
        ).style.display = "block";

        document.getElementById(
            "btnSheet"
        ).classList.add("active");

    } else if (tabName === "schools") {
        document.getElementById(
            "contentSchools"
        ).style.display = "block";

        document.getElementById(
            "btnSchools"
        ).classList.add("active");

        if (window.initializeSchools) {
            window.initializeSchools();
        }
    }
}

window.switchTab = switchTab;