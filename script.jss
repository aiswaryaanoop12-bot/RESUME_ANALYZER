async function analyzeResume() {

    const fileInput = document.getElementById("resumeFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload a PDF resume");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const loader = document.getElementById("loader");
    const results = document.getElementById("results");

    loader.style.display = "block";
    results.innerHTML = "";

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/analyze",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        loader.style.display = "none";

        if (data.error) {
            results.innerHTML = `<p>${data.error}</p>`;
            return;
        }

        const r = data.result;

        // Grade
        let grade = "D";

        if (r.ats_score >= 90)
            grade = "A+";
        else if (r.ats_score >= 80)
            grade = "A";
        else if (r.ats_score >= 70)
            grade = "B";
        else if (r.ats_score >= 60)
            grade = "C";

        // Grade Color
        let gradeColor = "#ef4444";

        if (grade === "A+" || grade === "A")
            gradeColor = "#22c55e";
        else if (grade === "B")
            gradeColor = "#f59e0b";

        results.innerHTML = `

        <div class="score-container">
    <div class="score-circle"
        style="
        background:conic-gradient(
            ${
                r.ats_score >= 80
                ? '#22c55e'
                : r.ats_score >= 60
                ? '#f59e0b'
                : '#ef4444'
            }
            ${r.ats_score * 3.6}deg,
            rgba(255,255,255,0.12) 0deg
        );
    ">
        <div class="score-value">
            ${r.ats_score}%
        </div>

        <div class="score-label">
            ATS SCORE
        </div>
    </div>
</div>

        <div class="grade-card"
            style="background:${gradeColor};">
            <h2>🏆 Resume Grade: ${grade}</h2>
        </div>

        <div class="summary-card">
            <h3>📝 Resume Summary</h3>
            <p>${r.summary || "No summary available."}</p>
        </div>

        <div class="skills-card">
            <h3>🛠 Detected Skills</h3>

            <div class="skill-tags">
                ${(r.skills || []).map(skill =>
                    `<span class="skill-badge">${skill}</span>`
                ).join("")}
            </div>
        </div>

        <div class="section">
            <h3>✅ Strengths</h3>
            <ul>
                ${(r.strengths || []).map(item =>
                    `<li>${item}</li>`
                ).join("")}
            </ul>
        </div>

        <div class="section">
            <h3>❌ Weaknesses</h3>
            <ul>
                ${(r.weaknesses || []).map(item =>
                    `<li>${item}</li>`
                ).join("")}
            </ul>
        </div>

        <div class="section">
            <h3>⚠ Missing Skills</h3>
            <ul>
                ${(r.missing_skills || []).map(item =>
                    `<li>${item}</li>`
                ).join("")}
            </ul>
        </div>

        <div class="section">
            <h3>🚀 Improvements</h3>
            <ul>
                ${(r.improvements || []).map(item =>
                    `<li>${item}</li>`
                ).join("")}
            </ul>
        </div>

        <div class="section">
            <h3>📄 Resume Information</h3>
            <ul>
                <li><strong>File:</strong> ${data.filename}</li>
                <li><strong>Processing Time:</strong> ${data.processing_time} sec</li>
            </ul>
        </div>

        `;

    } catch (error) {

        loader.style.display = "none";

        results.innerHTML =
            "<p>Failed to analyze resume.</p>";

        console.error(error);
    }
}

function toggleTheme() {

    document.body.classList.toggle("theme-light");

    localStorage.setItem(
        "theme",
        document.body.classList.contains("theme-light")
            ? "light"
            : "dark"
    );
}

window.onload = () => {

    if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("theme-light");
    }

};
