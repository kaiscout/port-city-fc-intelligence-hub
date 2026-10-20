# Three-minute walkthrough

Current project name: **Port City FC Business Intelligence & Analytics**.
The existing video and frames are dated evidence recorded before this rename
and retain their original names/content. The narration and recording template
use the current name for future rebuilds; a text edit does not imply the stored
video or audio has been regenerated. Legacy filenames remain for link stability.

Candidate 6.0: this folder contains the narrated portfolio walkthrough, its exact narration and four frames captured from the tested candidate. The public command/finance/scenario frames use the synthetic static demonstration; the Operations frame uses a disposable synthetic private organization, not club records. Public planning remains read-only; saved versions belong to the separately verified private workflow.

Rebuild on Windows:

```powershell
.\scripts\generate-walkthrough-audio.ps1 -Rate 0
$env:FFMPEG_PATH = 'PATH-TO-YOUR-FFMPEG-EXECUTABLE'
node .\scripts\record-walkthrough.mjs
node .\scripts\check-walkthrough.mjs
```

The HTML recorder fits narration to a three-minute timeline and preserves the captured aspect ratio. FFmpeg is optional for indexed-container remuxing; it is not an application dependency. Chromium must be installed for Playwright, or specified with CHROMIUM_EXECUTABLE_PATH. The verification helper checks duration, playback and seeking, and uses Chromium Web Audio to decode the narration and reject a silent track.

The recording explains the problem, evidence boundary, modeled finding, proposed decision, durable private workflow, architecture and controlled next step. All visible data is synthetic or generalized. It does not claim native Power BI acceptance, club endorsement, operational deployment or achieved financial benefits. Publication still requires Deniz's approval.
