import "./details/evolution.js";
import "./details/comparison.js";
import "./details/sheet.js";

function switchTab(tabName) {
    document.getElementById("contentSheet").style.display = "none";
    document.getElementById("contentEvolution").style.display = "none";
    document.getElementById("contentComparison").style.display = "none";

    document.getElementById("btnSheet").classList.remove("active");
    document.getElementById("btnEvolution").classList.remove("active");
    document.getElementById("btnComparison").classList.remove("active");

    if (tabName === "sheet") {
        document.getElementById("contentSheet").style.display = "block";
        document.getElementById("btnSheet").classList.add("active");

    } else if (tabName === "evolution") {
        document.getElementById("contentEvolution").style.display = "block";
        document.getElementById("btnEvolution").classList.add("active");

        window.initializeEvolution();

    } else if (tabName === "comparison") {
        document.getElementById("contentComparison").style.display = "block";
        document.getElementById("btnComparison").classList.add("active");

        if (window.initializeComparison) {
            window.initializeComparison();
        }
    }
}

window.switchTab = switchTab;