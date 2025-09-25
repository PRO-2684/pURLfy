const $ = document.querySelector.bind(document);

async function purlfy(url) {
    output.value = "Loading...";
    match.value = "Loading...";

    try {
        const r = await fetch("/purify?url=" + encodeURIComponent(url));
        const data = await r.json();
        output.value = data.url;
        match.value = data.rule;
    } catch (e) {
        output.value = "Error - See console";
        match.value = "Error - See console";
        console.error(e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    input.addEventListener("change", () => {
        const url = input.value;
        purlfy(url);
    });

    // Handle example button clicks
    document.querySelectorAll(".example-btn").forEach(button => {
        button.addEventListener("click", () => {
            const url = button.getAttribute("data-url");
            input.value = url;
            input.dispatchEvent(new Event("change"));
        });
    });
});
