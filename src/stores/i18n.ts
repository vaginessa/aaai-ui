import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useLanguageStore = defineStore("i18n", () => {

    const currentLanguage = ref("en");

    const english = ref("en");
    const german = ref("de");
    
    const GEDirectory:{[key: string]: string} = {
        "ttsampler":"k_heun und k_dpm_2 verdoppeln die Generierungszeit und die Kudos-Kosten, konvergieren aber doppelt so schnell.",
        "ttsteps":"Halten Sie die Schrittzahl zwischen 20 und 30 für optimale Generierungszeiten. Die Kohärenz erreicht in der Regel zwischen 60 und 90 Schritten ihren Höhepunkt, wobei ein Kompromiss bei der Geschwindigkeit eingegangen wird.",
        "ttcfg":"Bei höheren Werten beachtet die KI Ihre Eingabe mehr, benötigt aber möglicherweise eine höhere Schrittzahl. Bei niedrigeren Werten kann die KI kreativer sein.",
        "ttclipskip":"Wie viele Iterationen beim Parsen des CLIP-Modells übersprungen werden.",
        "ttpostprocessor":"GPFGAN und Codeformers verbessern Gesichter, RealESRGAN, NMKD, AnimeSharp: vergrößern das Bild, strip_background entfernt den Hintergrund.",
        "tttiling":"DERZEIT OFFLINE AUF COMFYUI! Erzeugt nahtlose Texturen! Sie können Ihre Bilder hier testen: https://www.pycheung.com/checker/",
        "ttkarras":"Verbessert die Bilderzeugung und erfordert weniger Schritte. Größtenteils Magie!",
        "tthiresfix":"Beginnt mit der Generierung in geringerer Auflösung, um Morphing zu vermeiden, skaliert dann hoch und füllt das Bild mit Details auf.",
        "tthiresfixx":"Sie benötigen ein Bild mit einer Größe von mindestens 576x576!",
        "tttrustedworker":"Lassen Sie nur vertrauenswürdige Arbeiter Ihre Anfragen bearbeiten, das kann zu längeren Warteschlangen führen.",
        "ttnsfw":"Zeigt Modelle auf der Liste, die als NSFW gekennzeichnet wurden. Wird nicht benötigt, um NSFW-Inhalte zu erzeugen.",
        "ttcensornsfw":"Sollen automatisch NSFW erkannte bilder zensiert werden? Übermäßig empfindlich!",
        "ttcensornsfwx":"NSFW ist deaktiviert!",
        "ttslowworker":"Wenn diese Option auf \"Wahr\" gesetzt wird, können auch langsamere Arbeiter diese Anfrage bearbeiten. Die Deaktivierung dieser Funktion verursacht zusätzliche Kudos-Kosten.",
        "ttreplacementfilter" :"Wenn diese Funktion aktiviert ist, werden Wörter, die unethische Inhalte erzeugen könnten, automatisch ersetzt. Wenn Sie die Funktion deaktivieren und unethische Dinge erkannt werden, müssen Sie mit langen Timeouts rechnen!",
        "ttdenoise":"Bei höheren Werten weicht das Ergebniss stärker vom Ausgangsbild ab.",
        "ttboomerang":"Hinein- und Herauszoomen. Nach der ersten Bewegung kehren Sie zum Anfang zurück.",
        "ttautozoom":"Versucht, den interessantesten Zoom zu erzeugen.",
        "ttinterpolate":"Durch die Interpolation zwischen den Einzelbildern wird die Animation glatter, ohne dass zu viele Einzelbilder gerendert werden müssen.",
        "ttlength":"Legt die Länge des gesamten Videos in Sekunden fest, so dass die Anzahl der von der KI generierten Bilder FPS*Länge entspricht.",

        "ttlargervalues":"Ermöglicht die Verwendung größerer Schrittgrößen und Dimensionen, wenn Sie die entsprechenden Kudos zur Verfügung haben.",
        "ttsharelaion":"Automatische und anonyme Weitergabe von Bildern an LAION (die gemeinnützige Organisation, die den Datensatz erstellt hat, der für das Training von Stable Diffusion verwendet wurde) zur Verwendung beim ästhetischen Training, um zukünftige Modelle zu verbessern. Weitere Informationen finden Sie in der Ankündigung unter https://discord.com/channels/781145214752129095/1020707945694101564/1061980573096226826. HINWEIS: Diese Option ist für Benutzer ohne gültigen API-Schlüssel automatisch aktiviert.",
        "ttmetadata":"Herunterladen und Zippen mit einer JSON-Datei die Generierungseinstellungen zu jedem Bild enthält.",
        "tttagautocomplete":"Verwenden Sie die Pfeiltasten nach oben und unten, um durch die Tag-Optionen zu blättern, und drücken Sie dann die Eingabetaste, um sie in die auswahl einzufügen.",

        "ttnegativeprompt":"Was aus dem Bild ausgeschlossen werden soll. Funktioniert nicht? Versuchen Sie, die Vorgabe zu erhöhen.",

        "engapikey":"API-Schlüssel",
        "engenterapikey":"Geben Sie hier Ihren API-Schlüssel ein",

        "lllargervalues":"Größere Werte",
        "llsharelaion":"Erstellte Bilder mit LAION teilen",
        "lltagautocomplete":"Tag Autovervollständigen",
        "llimagesperpage":"Bilder pro Seite",
        "llpageless":"Seitenloses Format",
        "llcarouselauto":"Autokarussell",
        "llfileformat":"Datenformat",
        "llmetadata":"Metadaten herunterladen",
        "llexportzip":"Bilder exportieren (ZIP-Datei)",
        "llimportzip":"Bilder importieren (ZIP-Datei)",
        "llcolormode":"Farbmodus:",

        "llgenerateprompt":"Eingabe generieren",
        "llprompthistory":"Eingabegeschichte",
        "descnoprompthistory":"Keine Eingabegeschichte gefunden - versuchen Sie, ein Bild zu erzeugen!",
        "llsearchbyprompt":"Nach Eingabe suchen",
        "descnomatchingprompt":"Es wurde(n) keine passende(n) Eingabe(n) für Ihre Suche gefunden.",
        "llpromptstyles":"Eingabe Stile",
        "descnostyles":"Keine Stile gefunden",
        "descsearcchnostyles":"Es wurde(n) kein(e) passende(r) Stil(e) zu Ihrer Suche gefunden.",
        "llsearchbystyle":"Suche nach Stil",
        "llusestyle":"Stil verwenden",
        "llnegativeprompt":"Negative Eingabe",
        "placeholdernegative":"Negative Eingabe hier eingeben",
        "lladdnegativeprompt":"Negative Eingabe hinzufügen",
        "llnegativeprompts":"Negative Eingaben",
        "descnonegativeprompts":"Keine negativen Eingaben gefunden",
        "descnomatchingnegativeprompts":"Es wurde(n) keine passende(n) negative(n) Eingabe(n) für Ihre Suche gefunden.",
        "lldeletepreset":"Voreinstellung löschen",
        "llusepreset":"Voreinstellung verwenden",

        "llmodel":"Modell",
        "llsampler":"Sampler",
        "llbatchsize":"Anzahl",
        "llsteps":"Schritte",
        "llpriorsteps":"Vorherige Schritte",
        "llwidth":"Breite",
        "llheight":"Höhe",
        "llcfg":"Vorgabe",
        "llpriorcfg":"Vorherige Vorgabe",
        "llclipskip":"Clip Skip",
        "llpostprocessors":"Postprozessoren",
        "llfacefixer":"Gesichter verbessern",
        "lltiling":"Nahtlos",
        "llkarras":"Karras",
        "llhiresfix":"HiRes Korrektur",
        "lltrustedworker":"Vertrauter Arbeiter",
        "llnsfw":"NSFW",
        "llcensornsfw":"Zensiert NSFW",
        "llslowworker":"Langsame Arbeiter",
        "llreplacementfilter":"Austauschfilter",
        "lldenoise":"Init-Stärke",
        "llfps":"Gewünschte FPS",
        "lllength":"Gewünschte Dauer",
        "llinterpolate":"Interpolieren",
        "llxinterpolate":"Interpolationszeiten",

        "llboomerang":"Bumerang",
        "llautozoom":"Auto-Zoom",
        "llstartx":"Start X Versatz",
        "llstarty":"Start Y Versatz",
        "llendx":"Ende X Versatz",
        "llendy":"Ende Y Versatz",
        "llzoomamount":"Zoom Stärke",
        "llzoomduration":"Zoom Dauer",
        "llframerate":"Bildrate",
        "llmusic":"Musik Generation",

        "llsignin":"Anmelden",
        "llloadingimage":"Bild lädt...",
        "llstartrating":"Bewertung starten!",

        "vidattention":"ACHTUNG!",
        "vidattention2":"Kann keine weiteren Generierungsanfragen annehmen!",
        "vidattention3":"Um mehr zu erfahren, besuchen Sie unser ",

        "abouttext1":"Dieses Tool bietet ein Front-End, um Bilder mit Stable Diffusion kostenlos zu erstellen! Es werden keine Downloads, teure Hardware oder zusätzliche Software benötigt. Wir bringen Ihnen die neuesten Tools in einem einfachen, kompakten und leicht verständlichen Paket! Derzeit werden mehr als 200 Modelle unterstützt, um all Ihre realistischen, künstlerischen, Anime- und Cartoon-Bedürfnisse abzudecken, und es kommen fast täglich neue hinzu.",
        "abouttext2":"Suchen Sie einen Ort, an dem Sie Ihre Kunst mit anderen teilen, Fragen stellen oder sich mit Gleichgesinnten austauschen können? Besuchen Sie unser ",
        "abouttext3":"Wenn Sie dieses Projekt unterstützen möchten, gehen Sie zu ",
        "abouttext3b":"Jede Spende hilft uns, die Benutzeroberfläche zu pflegen, die Infrastrukturkosten ab zu decken und möglicherweise weitere Programmierer einzustellen, um Ihr Erlebnis noch besser zu machen.!",
        "abouttext4":"Wenn Sie einen API-Schlüssel benötigen, können Sie einen erhalten unter ",
        "abouttext5":"DadJokes von ",
        "abouttext6":"Basierend auf der stableUI, entwickelt von ",
        "abouttext7":"Powerd by ",

        "dashboardtext1":"Sie sind angemeldet als ",
        "dashrequiresapikey":"Benutzerstatistiken erfordern einen API-Schlüssel",
        "dashnoworkersfound":"Keine Arbeiter gefunden",
        "dashrequiresapikey2":"Für die Änderung/Ansicht von Benutzerarbeitern ist ein API-Schlüssel erforderlich",

        "ratingtitle":"Bild Bewertung",
        "ratingtext1":"Bewerten Sie Bilder nach ihrer Ästhetik, um Anerkennung und Hilfe zu erhalten ",
        "ratingtext2":" - ie gemeinnützige Organisation, die bei der Ausbildung von Stable Diffusion geholfen hat - ihre Datensätze zu verbessern!",
        "ratingtext3":"Sie haben Bilder bewertet, ",
        "ratingtext4":" benutzen Sie Ihren API-Schlüssel, um Kudos zu verdienen.",
        "ratingtext5":"Aus der Bewertung von insgesamt ",
        "ratingtext6":" Bildern, erhielten Sie ",

    }

    const ENDirectory:{[key: string]: string} = {
        "ttsampler":"k_heun and k_dpm_2 double generation time and kudos cost, but converge twice as fast.",
        "ttsteps":"Keep step count between 20-30 for optimal generation times. Coherence typically peaks between 60 and 90 steps, with a trade-off in speed.",
        "ttcfg":"Higher values will make the AI respect your prompt more, but might need higher step count. Lower values allow the AI to be more creative.",
        "ttclipskip":"How many iterations will be skipped while parsing the CLIP model.",
        "ttpostprocessor":"GPFGAN and Codeformers Improves faces, RealESRGAN, NMKD, AnimeSharp: Upscalers, strip_background removes the background.",
        "tttiling":"CURRENTLY OFFLINE ON COMFYUI! Creates seamless textures! You can test your resulting images here: https://www.pycheung.com/checker/",
        "ttkarras":"Improves image generation while requiring fewer steps. Mostly magic!",
        "tthiresfix":"Starts generating in lower resolution to avoid morphing, then upscales and fills in the image with details.",
        "tthiresfixx":"You need to have an image that is at least 576x576!",
        "tttrustedworker":"Only let trusted workers process your requests, might result in longer queues.",
        "ttnsfw":"Shows models on the list that were flagged as NSFW. Not needed to generate NSFW content.",
        "ttcensornsfw":"If nsfw material this toggle will censor them. Overly sensitive!",
        "ttcensornsfwx":"NSFW is Disabled!",
        "ttslowworker":"When True, allows slower workers to pick up this request. Disabling this incurs an extra kudos cost.",
        "ttreplacementfilter" :"If enabled, words that might generate unethical content are automatically replaced. If you disable it, and prompt unethical things, exepct long timeouts!",
        "ttdenoise":"The final image will diverge more from the starting image at higher values.",
        "ttboomerang":"Zoom In and Out. After the inital move, reverse back to the begining.",
        "ttautozoom":"Tries to generate the most intresting Zoom.",
        "ttinterpolate":"Interpolation between frames will make the animation look smoother without having to render out too many frames.",
        "ttlength":"Sets the length of the entire video in seconds, so the number of AI generated frames will be FPS*Length.",

        "ttlargervalues":"Allows use of larger step values and dimension sizes if you have the kudos on hand.",
        "ttsharelaion":"Automatically and anonymously share images with LAION (the non-profit that created the dataset that was used to train Stable Diffusion) for use in aesthetic training in order to improve future models. See the announcement at https://discord.com/channels/781145214752129095/1020707945694101564/1061980573096226826 for more information. NOTE: This option is automatically enabled for users without a valid API key. ",
        "ttmetadata":"Downloads or Zips a JSON file with generation settings to every images.",
        "tttagautocomplete":"Use the up and down arrow keys to scroll through tag options then press 'Enter' to insert it into the prompt.",

        "ttnegativeprompt":"What to exclude from the image. Not working? Try increasing the guidance.",

        "engapikey":"API Key",
        "engenterapikey":"Enter your API key here",

        "lllargervalues":"Larger Values",
        "llsharelaion":"Share Generated Images with LAION",
        "lltagautocomplete":"Tag Autocomplete",
        "llimagesperpage":"Images Per Page",
        "llpageless":"Pageless Format",
        "llcarouselauto":"Carousel Auto Cycle",
        "llfileformat":"Download Fileformat",
        "llmetadata":"Download Meta Data",
        "llexportzip":"Export Images (ZIP File)",
        "llimportzip":"Import Images (ZIP File)",
        "llcolormode":"Color Mode:",

        "llgenerateprompt":"Generate Prompt",
        "llprompthistory":"Prompt History",
        "descnoprompthistory":"No prompt history found - try generating an image!",
        "llsearchbyprompt":"Search by prompt",
        "descnomatchingprompt":"Found no matching prompt(s) from your search.",
        "llpromptstyles":"Prompt Styles",
        "descnostyles":"No styles found",
        "descsearcchnostyles":"Found no matching style(s) from your search.",
        "llsearchbystyle":"Search by style",
        "llusestyle":"Use style",
        "llnegativeprompt":"Negative Prompt",
        "placeholdernegative":"Enter negative prompt here",
        "lladdnegativeprompt":"Add Negative Prompt",
        "llnegativeprompts":"Negative Prompts",
        "descnonegativeprompts":"No negative prompts found",
        "descnomatchingnegativeprompts":"Found no matching negative prompt(s) from your search.",
        "lldeletepreset":"Delete Preset",
        "llusepreset":"Use Preset",

        "llmodel":"Model",
        "llsampler":"Sampler",
        "llbatchsize":"Batch Size",
        "llsteps":"Steps",
        "llpriorsteps":"Prior Steps",
        "llwidth":"Width",
        "llheight":"Height",
        "llcfg":"Guidance",
        "llpriorcfg":"Prior Guidance",
        "llclipskip":"Clip Skip",
        "llpostprocessors":"Post Processors",
        "llfacefixer":"Face Fixer",
        "lltiling":"Tiling",
        "llkarras":"Karras",
        "llhiresfix":"HiRes Fix",
        "lltrustedworker":"Truster Worker",
        "llnsfw":"NSFW",
        "llcensornsfw":"Censor NSFW",
        "llslowworker":"Slow Worker",
        "llreplacementfilter":"Replacement Filter",
        "lldenoise":"Init Strength",
        "llfps":"Desired FPS",
        "lllength":"Desired Length",
        "llinterpolate":"Interpolate",
        "llxinterpolate":"Times to Interpolate",

        "llboomerang":"Boomerang",
        "llautozoom":"Auto Zoom",
        "llstartx":"Start X Offset",
        "llstarty":"Start Y Offset",
        "llendx":"End X Offset",
        "llendy":"End Y Offset",
        "llzoomamount":"Zoom Amount",
        "llzoomduration":"Zoom Duration",
        "llframerate":"Frame Rate",
        "llmusic":"Music Generation",

        "llsignin":"Sign In",
        "llloadingimage":"Loading image...",
        "llstartrating":"Start rating!",

        "vidattention":"ATTENTION!",
        "vidattention2":"Can not accept more generation requests!",
        "vidattention3":"To find out more join our ",

        "abouttext1":"This tool provides a front-end to generate images with Stable Diffusion for free! No downloads, expensive hardware, or additional softwares are needed. We are bringing you all the latest tools in a simple, compact, and easy to understand package! Currently supporting 200+ models to cover all your realistic, artistic, anime, cartoon or other needs, with new ones being added almost every day.",
        "abouttext2":"Looking for a place to share your art, ask questions, or have a chat with likeminded individuals? Join our ",
        "abouttext3":"If you want to show some love and support this project, head over to ",
        "abouttext3b":"Every donation helps us to maintain the UI, cover infrastructure costs, and potentially hire more programmers to make your experience even better!",
        "abouttext4":"If you are in need of an API-Key you can get one at ",
        "abouttext5":"DadJokes by ",
        "abouttext6":"Based on the stableUI, developed by ",
        "abouttext7":"Powerd by the ",

        "dashboardtext1":"You are logged in as ",
        "dashrequiresapikey":"User statistics requires an API key",
        "dashnoworkersfound":"No Workers Found",
        "dashrequiresapikey2":"Modifying/viewing user workers requires an API key",

        "ratingtitle":"Image Rating",
        "ratingtext1":"Rate images based on aesthetics to gain kudos and help ",
        "ratingtext2":" - the non-profit who helped train Stable Diffusion - improve their datasets!",
        "ratingtext3":"You have rated images, numbering ",
        "ratingtext4":" using your API key to start earning kudos.",
        "ratingtext5":"From rating a total of ",
        "ratingtext6":" images, you have gained ",

    }

    function GetText(name: string) {
        name = name.replace(/[^0-9a-z]/gi, '')
        if(currentLanguage.value == english.value)
            return ENDirectory[name]
        else if(currentLanguage.value == german.value)
            return GEDirectory[name]
        else
            return "Missing Language: " + currentLanguage.value
    }

    return {
        GetText
    }
});
