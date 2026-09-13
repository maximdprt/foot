# Rapport de génération de `teams.json`

- Généré le : 2026-09-13T17:38:34.831Z
- Saison : 2026-27
- Équipes : 181 (dont l'entrée `none`)
- Requêtes réseau : 0 · réponses servies depuis le cache : 554
- Classement FIFA utilisé : 2026-07-20 (https://inside.fifa.com/fifa-world-ranking/men?dateId=FRS_Male_Football_20260611)

## Sources

| Rôle | Source | Usage |
|---|---|---|
| Effectifs | Wikipédia (en), pages « 2026–27 <championnat> », table *Stadiums and locations* | liste des clubs, ville |
| Couleurs C (prioritaire) | `scripts/data/official-colors.json` — chartes officielles / identités documentées | primaire, secondaire, tertiaire |
| Couleurs B | TheSportsDB (`searchteams.php`, clé publique) — `strColour1/2/3`, `strTeamShort`, `strLocation` | primaire, secondaire, tertiaire, abréviation |
| Couleurs A | Wikipédia (en) — infobox du club, hex du maillot domicile (`body1`, `shorts1`, `socks1`…) ; Wikipédia (fr) — `couleur cadre` / `couleur écriture` | repli + contrôle croisé |
| Sélections | Module Lua Wikipédia `SportsRankings/data/FIFA World Rankings` (classement FIFA complet) | top 30 |

Règle de fusion : **charte officielle > TheSportsDB > maillot Wikipédia (en) > infobox (fr)**. Chaque primaire retenue est comparée aux autres sources (ΔE CIE76 ≤ 30 = même famille de couleur ; blanc/blanc et noir/noir comptent comme concordants).

## Effectifs

| Championnat | Équipes |
|---|---|
| Ligue 1 | 18 |
| Ligue 2 | 18 |
| Premier League | 20 |
| La Liga | 20 |
| Serie A | 20 |
| Bundesliga | 18 |
| Liga Portugal | 18 |
| Eredivisie | 18 |
| Sélections nationales | 30 |

## Équipes avec `themeOverride` (84)

Le blanc est la base de l'app : une primaire blanche ou trop claire (contraste < 4,5:1 sur blanc) est remplacée par une couleur foncée issue de l'identité du club. `primary` d'origine = couleur documentée du club, conservée dans `colors` ; `themeOverride.primary` = couleur effectivement utilisée par le moteur de thème.

| Équipe | Championnat | Primaire d'origine (contraste) | Override primaire (contraste) | Override secondaire | Type | Raison |
|---|---|---|---|---|---|---|
| Aucune équipe | none | `#2E9E5B` (3.41) | `#27864D` (4.56) | `#121212` | auto (assombri) | Vert pelouse #2E9E5B assombri en #27864D : la primaire sert aussi au texte et aux icônes sur blanc (3,41:1 → 4,56:1, WCAG AA). |
| Auxerre | Ligue 1 | `#4087BF` (3.86) | `#757575` (4.61) | `#FFFFFF` | curé | Maillot blanc : bleu de l'AJA en primaire (assombri si besoin), blanc en secondaire. — #FFFFFF → #757575 (assombri pour AA) |
| Brest | Ligue 1 | `#ED1C24` (4.38) | `#E7121A` (4.67) | `#FFFFFF` | auto (assombri) | auto-darkened from #ED1C24 for WCAG AA (contraste 4.38:1) |
| Le Havre | Ligue 1 | `#79BCE7` (2.07) | `#193260` (12.60) | `#79BCE7` | curé | « Ciel et marine » : le bleu ciel est trop clair ; bleu marine en primaire, bleu ciel en secondaire. |
| Le Mans | Ligue 1 | `#FF0000` (4.00) | `#EB0000` (4.63) | `#FFFF00` | auto (assombri) | auto-darkened from #FF0000 for WCAG AA (contraste 4.00:1) |
| Lens | Ligue 1 | `#FFF200` (1.17) | `#EA141C` (4.55) | `#FFF200` | curé | « Sang et or » : le jaune est trop clair ; rouge en primaire (assombri si besoin), jaune en secondaire. — #EC1C24 → #EA141C (assombri pour AA) |
| Lille | Ligue 1 | `#FE0000` (4.03) | `#EA0000` (4.67) | `#221F64` | auto (assombri) | auto-darkened from #FE0000 for WCAG AA (contraste 4.03:1) |
| Lorient | Ligue 1 | `#F58113` (2.61) | `#B45B08` (4.73) | `#000000` | auto (assombri) | auto-darkened from #F58113 for WCAG AA (contraste 2.61:1) |
| Lyon | Ligue 1 | `#FFFFFF` (1.00) | `#0F23AA` (11.41) | `#F40043` | curé | Maillot blanc : bleu de l'OL (bande bleue et rouge) en primaire, rouge en secondaire. |
| Marseille | Ligue 1 | `#FFFFFF` (1.00) | `#197DA5` (4.65) | `#FFFFFF` | curé | Maillot blanc : le blanc est déjà la base de l'app ; bleu ciel OM assombri jusqu'à AA, blanc en secondaire. — #2FAEE0 → #197DA5 (assombri pour AA) |
| Rennes | Ligue 1 | `#E13327` (4.46) | `#E02F23` (4.56) | `#000000` | auto (assombri) | auto-darkened from #E13327 for WCAG AA (contraste 4.46:1) |
| Strasbourg | Ligue 1 | `#009FE3` (2.97) | `#007BB0` (4.71) | `#DC2F34` | auto (assombri) | auto-darkened from #009FE3 for WCAG AA (contraste 2.97:1) |
| Dijon | Ligue 2 | `#FF0000` (4.00) | `#EB0000` (4.63) | `#FFFFFF` | auto (assombri) | auto-darkened from #FF0000 for WCAG AA (contraste 4.00:1) |
| Guingamp | Ligue 2 | `#FF0000` (4.00) | `#EB0000` (4.63) | `#000000` | auto (assombri) | auto-darkened from #FF0000 for WCAG AA (contraste 4.00:1) |
| Laval | Ligue 2 | `#FF6000` (3.03) | `#CC4D00` (4.54) | `#000000` | auto (assombri) | auto-darkened from #FF6000 for WCAG AA (contraste 3.03:1) |
| Nancy | Ligue 2 | `#FFFFFF` (1.00) | `#000000` (21.00) | `#121212` | auto (blanc) | Couleur principale #FFFFFF (blanc / très claire) : le blanc est déjà la base de l'app ; on utilise la couleur secondaire du club #000000. |
| Nantes | Ligue 2 | `#FCD405` (1.44) | `#198637` (4.66) | `#FCD405` | curé | Jaune trop clair : vert des Canaris en primaire (assombri si besoin), jaune en secondaire. — #1B8F3A → #198637 (assombri pour AA) |
| Pau | Ligue 2 | `#FFD700` (1.40) | `#8A7400` (4.59) | `#191970` | auto (assombri) | auto-darkened from #FFD700 for WCAG AA (contraste 1.40:1) |
| Red Star | Ligue 2 | `#FFFFFF` (1.00) | `#0C6646` (6.99) | `#124940` | auto (blanc) | Couleur principale #FFFFFF (blanc / très claire) : le blanc est déjà la base de l'app ; on utilise la couleur secondaire du club #0C6646. |
| Reims | Ligue 2 | `#FF0000` (4.00) | `#EB0000` (4.63) | `#FFFFFF` | auto (assombri) | auto-darkened from #FF0000 for WCAG AA (contraste 4.00:1) |
| Saint-Étienne | Ligue 2 | `#139A5A` (3.62) | `#11884F` (4.51) | `#19985B` | auto (assombri) | auto-darkened from #139A5A for WCAG AA (contraste 3.62:1) |
| Sochaux | Ligue 2 | `#FFFE2A` (1.08) | `#767600` (4.81) | `#0B1031` | auto (assombri) | auto-darkened from #FFFE2A for WCAG AA (contraste 1.08:1) |
| Arsenal | Premier League | `#EF0107` (4.49) | `#EA0107` (4.66) | `#FFFFFF` | auto (assombri) | auto-darkened from #EF0107 for WCAG AA (contraste 4.49:1) |
| Coventry City | Premier League | `#77BBFF` (2.03) | `#0074E7` (4.51) | `#FFFFFF` | auto (assombri) | auto-darkened from #77BBFF for WCAG AA (contraste 2.03:1) |
| Fulham | Premier League | `#FFFFFF` (1.00) | `#121212` (18.73) | `#CC0000` | curé | Club noir et blanc : noir (identique au texte de l'app) en primaire, rouge du blason en secondaire. |
| Hull City | Premier League | `#F18A01` (2.51) | `#AF6401` (4.52) | `#000000` | auto (assombri) | auto-darkened from #F18A01 for WCAG AA (contraste 2.51:1) |
| Leeds United | Premier League | `#FFFFFF` (1.00) | `#1D428A` (9.55) | `#FFCD00` | curé | Maillot blanc : bleu Leeds (#1D428A) en primaire, jaune en secondaire. |
| Manchester City | Premier League | `#6CABDD` (2.47) | `#2B7AB8` (4.59) | `#1C2C5B` | curé | Bleu ciel assombri jusqu'à AA (teinte conservée), bleu marine City en secondaire. — #6CABDD → #2B7AB8 (assombri pour AA) |
| Sunderland | Premier League | `#EB172B` (4.48) | `#E91428` (4.57) | `#FFFFFF` | auto (assombri) | auto-darkened from #EB172B for WCAG AA (contraste 4.48:1) |
| Tottenham Hotspur | Premier League | `#FFFFFF` (1.00) | `#132257` (15.06) | `#FFFFFF` | curé | Maillot blanc : bleu marine des Spurs (#132257) en primaire. |
| Athletic Bilbao | La Liga | `#EE2523` (4.26) | `#EA1412` (4.56) | `#FFFFFF` | auto (assombri) | auto-darkened from #EE2523 for WCAG AA (contraste 4.26:1) |
| Celta Vigo | La Liga | `#8AC3EE` (1.89) | `#1C78BE` (4.69) | `#E5254E` | curé | Bleu ciel assombri jusqu'à AA, rouge en secondaire. — #8AC3EE → #1C78BE (assombri pour AA) |
| Espanyol | La Liga | `#007FC8` (4.31) | `#0079BE` (4.69) | `#FFFFFF` | auto (assombri) | auto-darkened from #007FC8 for WCAG AA (contraste 4.31:1) |
| Málaga | La Liga | `#FFFFFF` (1.00) | `#103E9E` (9.52) | `#121212` | auto (blanc) | Couleur principale #FFFFFF (blanc / très claire) : le blanc est déjà la base de l'app ; on utilise la couleur secondaire du club #103E9E. |
| Racing Santander | La Liga | `#FFFFFF` (1.00) | `#328425` (4.71) | `#000000` | auto (blanc) | Couleur principale #FFFFFF (blanc / très claire) : le blanc est déjà la base de l'app ; on utilise la couleur secondaire du club #369028 assombrie en #328425 pour WCAG AA. |
| Rayo Vallecano | La Liga | `#FFFFFF` (1.00) | `#E4271E` (4.56) | `#FFFFFF` | curé | Maillot blanc à bande rouge : rouge de la bande en primaire (assombri si nécessaire). — #E53027 → #E4271E (assombri pour AA) |
| Real Betis | La Liga | `#00954C` (3.89) | `#008644` (4.67) | `#FFFFFF` | auto (assombri) | auto-darkened from #00954C for WCAG AA (contraste 3.89:1) |
| Real Madrid | La Liga | `#FFFFFF` (1.00) | `#00529F` (7.76) | `#FEBE10` | curé | Maillot blanc : bleu Real Madrid (#00529F) en primaire, or en secondaire. |
| Sevilla | La Liga | `#FFFFFF` (1.00) | `#EC0D0D` (4.54) | `#C79100` | auto (blanc) | Couleur principale #FFFFFF (blanc / très claire) : le blanc est déjà la base de l'app ; on utilise la couleur secondaire du club #F43333 assombrie en #EC0D0D pour WCAG AA. |
| Valencia | La Liga | `#FF671F` (2.91) | `#D14300` (4.65) | `#000000` | auto (assombri) | auto-darkened from #FF671F for WCAG AA (contraste 2.91:1) |
| Villarreal | La Liga | `#FFE667` (1.25) | `#005187` (8.31) | `#FFE667` | curé | Jaune trop clair : bleu marine du club en primaire, jaune en secondaire. |
| AC Milan | Serie A | `#FB090B` (4.08) | `#EC0406` (4.58) | `#000000` | auto (assombri) | auto-darkened from #FB090B for WCAG AA (contraste 4.08:1) |
| Frosinone | Serie A | `#FFDD00` (1.35) | `#857300` (4.72) | `#004393` | auto (assombri) | auto-darkened from #FFDD00 for WCAG AA (contraste 1.35:1) |
| Lazio | Serie A | `#87D8F7` (1.59) | `#0B7FAC` (4.52) | `#FFFFFF` | auto (assombri) | auto-darkened from #87D8F7 for WCAG AA (contraste 1.59:1) |
| Lecce | Serie A | `#FFF200` (1.17) | `#7F7900` (4.53) | `#ED1B23` | auto (assombri) | auto-darkened from #FFF200 for WCAG AA (contraste 1.17:1) |
| Monza | Serie A | `#EC173A` (4.42) | `#E61336` (4.66) | `#FFFFFF` | auto (assombri) | auto-darkened from #EC173A for WCAG AA (contraste 4.42:1) |
| Napoli | Serie A | `#12A0D7` (2.98) | `#0E7DA8` (4.65) | `#003C82` | auto (assombri) | auto-darkened from #12A0D7 for WCAG AA (contraste 2.98:1) |
| Parma | Serie A | `#FFFFFF` (1.00) | `#1B4094` (9.51) | `#FFD200` | auto (blanc) | Couleur principale #FFFFFF (blanc / très claire) : le blanc est déjà la base de l'app ; on utilise la couleur secondaire du club #1B4094. |
| Sassuolo | Serie A | `#00A752` (3.16) | `#008843` (4.56) | `#000000` | auto (assombri) | auto-darkened from #00A752 for WCAG AA (contraste 3.16:1) |
| Udinese | Serie A | `#FFFFFF` (1.00) | `#121212` (18.73) | `#FFFFFF` | curé | Club bianconero : noir en primaire, blanc en secondaire. |
| 1. FC Köln | Bundesliga | `#FFFFFF` (1.00) | `#E7121A` (4.67) | `#FFFFFF` | curé | Maillot blanc : rouge du club en primaire (assombri pour AA). — #ED1C24 → #E7121A (assombri pour AA) |
| Borussia Dortmund | Bundesliga | `#FDE100` (1.32) | `#121212` (18.73) | `#FDE100` | curé | Jaune trop clair pour du texte : noir (2e couleur du BVB) en primaire, jaune conservé en secondaire (pastille, dégradés). |
| Mainz 05 | Bundesliga | `#ED1C24` (4.38) | `#E7121A` (4.67) | `#FFFFFF` | auto (assombri) | auto-darkened from #ED1C24 for WCAG AA (contraste 4.38:1) |
| Union Berlin | Bundesliga | `#EB1923` (4.47) | `#EB141F` (4.51) | `#FFFFFF` | auto (assombri) | auto-darkened from #EB1923 for WCAG AA (contraste 4.47:1) |
| Werder Bremen | Bundesliga | `#1D9053` (4.06) | `#1A834C` (4.78) | `#FFFFFF` | auto (assombri) | auto-darkened from #1D9053 for WCAG AA (contraste 4.06:1) |
| Arouca | Liga Portugal | `#FEF405` (1.16) | `#7E7901` (4.54) | `#024CAB` | auto (assombri) | auto-darkened from #FEF405 for WCAG AA (contraste 1.16:1) |
| Benfica | Liga Portugal | `#E83030` (4.29) | `#E62222` (4.55) | `#FFFFFF` | auto (assombri) | auto-darkened from #E83030 for WCAG AA (contraste 4.29:1) |
| Famalicão | Liga Portugal | `#FFFFFF` (1.00) | `#0B3D6B` (11.09) | `#F0C61C` | auto (blanc) | Couleur principale #FFFFFF (blanc / très claire) : le blanc est déjà la base de l'app ; on utilise la couleur secondaire du club #0B3D6B. |
| Marítimo | Liga Portugal | `#FF0000` (4.00) | `#EB0000` (4.63) | `#FFFFFF` | auto (assombri) | auto-darkened from #FF0000 for WCAG AA (contraste 4.00:1) |
| Nacional | Liga Portugal | `#FFFFFF` (1.00) | `#857400` (4.67) | `#000000` | auto (blanc) | Couleur principale #FFFFFF (blanc / très claire) : le blanc est déjà la base de l'app ; on utilise la couleur secondaire du club #FFE000 assombrie en #857400 pour WCAG AA. |
| Rio Ave | Liga Portugal | `#009036` (4.16) | `#008632` (4.71) | `#FFFFFF` | auto (assombri) | auto-darkened from #009036 for WCAG AA (contraste 4.16:1) |
| Santa Clara | Liga Portugal | `#FF0000` (4.00) | `#EB0000` (4.63) | `#FFFFFF` | auto (assombri) | auto-darkened from #FF0000 for WCAG AA (contraste 4.00:1) |
| Vitória de Guimarães | Liga Portugal | `#FFFFFF` (1.00) | `#000000` (21.00) | `#121212` | auto (blanc) | Couleur principale #FFFFFF (blanc / très claire) : le blanc est déjà la base de l'app ; on utilise la couleur secondaire du club #000000. |
| ADO Den Haag | Eredivisie | `#FFFF00` (1.07) | `#7A7A00` (4.55) | `#FFDD00` | auto (assombri) | auto-darkened from #FFFF00 for WCAG AA (contraste 1.07:1) |
| Cambuur | Eredivisie | `#FFEE00` (1.20) | `#7F7700` (4.62) | `#0000FF` | auto (assombri) | auto-darkened from #FFEE00 for WCAG AA (contraste 1.20:1) |
| N.E.C. | Eredivisie | `#ED1B24` (4.39) | `#EB131C` (4.52) | `#159A6F` | auto (assombri) | auto-darkened from #ED1B24 for WCAG AA (contraste 4.39:1) |
| PSV | Eredivisie | `#ED1C24` (4.38) | `#E7121A` (4.67) | `#FFFFFF` | auto (assombri) | auto-darkened from #ED1C24 for WCAG AA (contraste 4.38:1) |
| Telstar | Eredivisie | `#FFFFFF` (1.00) | `#016DB7` (5.42) | `#1B3359` | auto (blanc) | Couleur principale #FFFFFF (blanc / très claire) : le blanc est déjà la base de l'app ; on utilise la couleur secondaire du club #016DB7. |
| Willem II | Eredivisie | `#FFFFFF` (1.00) | `#121212` (18.73) | `#FFFFFF` | auto (blanc) | Couleur principale #FFFFFF (blanc / très claire) : le blanc est déjà la base de l'app ; on utilise la couleur secondaire du club #121212. |
| Argentine (ARG) | Sélections | `#74ACDF` (2.41) | `#2C7AC1` (4.51) | `#FFFFFF` | curé | Bleu ciel albiceleste assombri jusqu'à AA, blanc en secondaire. — #74ACDF → #2C7AC1 (assombri pour AA) |
| Angleterre (ENG) | Sélections | `#FFFFFF` (1.00) | `#297DA6` (4.59) | `#FFFFFF` | curé | Maillot blanc : bleu marine des Three Lions en primaire (assombri si besoin), blanc en secondaire. — #5AADD6 → #297DA6 (assombri pour AA) |
| Brésil (BRA) | Sélections | `#FFDF00` (1.33) | `#008833` (4.60) | `#FFDF00` | curé | Jaune trop clair : vert du drapeau en primaire (assombri pour AA), jaune en secondaire. — #009C3B → #008833 (assombri pour AA) |
| Portugal (POR) | Sélections | `#FF0000` (4.00) | `#EB0000` (4.63) | `#006600` | auto (assombri) | auto-darkened from #FF0000 for WCAG AA (contraste 4.00:1) |
| Pays-Bas (NED) | Sélections | `#F36C21` (3.01) | `#C74E0B` (4.64) | `#21468B` | curé | Orange assombri jusqu'à AA (teinte conservée), bleu du drapeau en secondaire. — #F36C21 → #C74E0B (assombri pour AA) |
| Colombie (COL) | Sélections | `#FCD116` (1.47) | `#003893` (10.57) | `#FCD116` | curé | Jaune trop clair : bleu du drapeau en primaire, jaune en secondaire. |
| Allemagne (GER) | Sélections | `#FFFFFF` (1.00) | `#121212` (18.73) | `#DD0000` | curé | Maillot blanc : noir en primaire, rouge du drapeau en secondaire. |
| Croatie (CRO) | Sélections | `#FF0000` (4.00) | `#EB0000` (4.63) | `#FFFFFF` | curé | Rouge du damier assombri jusqu'à AA, blanc en secondaire. — #FF0000 → #EB0000 (assombri pour AA) |
| Suisse (SUI) | Sélections | `#FF0000` (4.00) | `#EB0000` (4.63) | `#FFFFFF` | auto (assombri) | auto-darkened from #FF0000 for WCAG AA (contraste 4.00:1) |
| Uruguay (URU) | Sélections | `#55B5E5` (2.30) | `#1B7EAF` (4.52) | `#FFFFFF` | curé | Bleu celeste assombri jusqu'à AA, blanc en secondaire. — #55B5E5 → #1B7EAF (assombri pour AA) |
| Iran (IRN) | Sélections | `#FFFFFF` (1.00) | `#1D8636` (4.65) | `#DA0000` | curé | Maillot blanc : vert du drapeau en primaire (assombri pour AA), rouge en secondaire. — #239F40 → #1D8636 (assombri pour AA) |
| Autriche (AUT) | Sélections | `#ED2939` (4.22) | `#E91425` (4.57) | `#FFFFFF` | auto (assombri) | auto-darkened from #ED2939 for WCAG AA (contraste 4.22:1) |
| Équateur (ECU) | Sélections | `#FFDD00` (1.35) | `#034EA2` (8.03) | `#FFDD00` | curé | Jaune trop clair : bleu du drapeau en primaire, jaune en secondaire. |
| Australie (AUS) | Sélections | `#FFCD00` (1.50) | `#00843D` (4.81) | `#FFCD00` | curé | Or trop clair : vert national en primaire, or en secondaire. |
| Canada (CAN) | Sélections | `#FF0000` (4.00) | `#EB0000` (4.63) | `#FFFFFF` | curé | Rouge du drapeau assombri jusqu'à AA, blanc en secondaire. — #FF0000 → #EB0000 (assombri pour AA) |

## Primaires assombries automatiquement (43)

Teinte et saturation conservées, luminosité HSL réduite par pas de 1 % jusqu'à 4,5:1.

| Équipe | Origine | Assombrie | Contraste obtenu |
|---|---|---|---|
| Brest | `#ED1C24` | `#E7121A` | 4.67:1 |
| Le Mans | `#FF0000` | `#EB0000` | 4.63:1 |
| Lille | `#FE0000` | `#EA0000` | 4.67:1 |
| Lorient | `#F58113` | `#B45B08` | 4.73:1 |
| Rennes | `#E13327` | `#E02F23` | 4.56:1 |
| Strasbourg | `#009FE3` | `#007BB0` | 4.71:1 |
| Dijon | `#FF0000` | `#EB0000` | 4.63:1 |
| Guingamp | `#FF0000` | `#EB0000` | 4.63:1 |
| Laval | `#FF6000` | `#CC4D00` | 4.54:1 |
| Pau | `#FFD700` | `#8A7400` | 4.59:1 |
| Reims | `#FF0000` | `#EB0000` | 4.63:1 |
| Saint-Étienne | `#139A5A` | `#11884F` | 4.51:1 |
| Sochaux | `#FFFE2A` | `#767600` | 4.81:1 |
| Arsenal | `#EF0107` | `#EA0107` | 4.66:1 |
| Coventry City | `#77BBFF` | `#0074E7` | 4.51:1 |
| Hull City | `#F18A01` | `#AF6401` | 4.52:1 |
| Sunderland | `#EB172B` | `#E91428` | 4.57:1 |
| Athletic Bilbao | `#EE2523` | `#EA1412` | 4.56:1 |
| Espanyol | `#007FC8` | `#0079BE` | 4.69:1 |
| Real Betis | `#00954C` | `#008644` | 4.67:1 |
| Valencia | `#FF671F` | `#D14300` | 4.65:1 |
| AC Milan | `#FB090B` | `#EC0406` | 4.58:1 |
| Frosinone | `#FFDD00` | `#857300` | 4.72:1 |
| Lazio | `#87D8F7` | `#0B7FAC` | 4.52:1 |
| Lecce | `#FFF200` | `#7F7900` | 4.53:1 |
| Monza | `#EC173A` | `#E61336` | 4.66:1 |
| Napoli | `#12A0D7` | `#0E7DA8` | 4.65:1 |
| Sassuolo | `#00A752` | `#008843` | 4.56:1 |
| Mainz 05 | `#ED1C24` | `#E7121A` | 4.67:1 |
| Union Berlin | `#EB1923` | `#EB141F` | 4.51:1 |
| Werder Bremen | `#1D9053` | `#1A834C` | 4.78:1 |
| Arouca | `#FEF405` | `#7E7901` | 4.54:1 |
| Benfica | `#E83030` | `#E62222` | 4.55:1 |
| Marítimo | `#FF0000` | `#EB0000` | 4.63:1 |
| Rio Ave | `#009036` | `#008632` | 4.71:1 |
| Santa Clara | `#FF0000` | `#EB0000` | 4.63:1 |
| ADO Den Haag | `#FFFF00` | `#7A7A00` | 4.55:1 |
| Cambuur | `#FFEE00` | `#7F7700` | 4.62:1 |
| N.E.C. | `#ED1B24` | `#EB131C` | 4.52:1 |
| PSV | `#ED1C24` | `#E7121A` | 4.67:1 |
| Portugal (POR) | `#FF0000` | `#EB0000` | 4.63:1 |
| Suisse (SUI) | `#FF0000` | `#EB0000` | 4.63:1 |
| Autriche (AUT) | `#ED2939` | `#E91425` | 4.57:1 |

## À vérifier — sources en désaccord (29)

La primaire retenue ne concorde avec aucune autre source (ΔE > 30). Le choix suit la priorité des sources ; à contrôler visuellement.

| Équipe | Primaire retenue (source) | Autres sources |
|---|---|---|
| Auxerre | `#4087BF` (sportsdb) | wikiKit=#FFFFFF, wikiFr=#004DA4 |
| Lens | `#FFF200` (sportsdb) | wikiFr=#B80B0D |
| Nice | `#000000` (sportsdb) | wikiKit=#FF0000, wikiFr=#DF0000 |
| Paris FC | `#000060` (wikiKit) | wikiFr=#020629 |
| Strasbourg | `#009FE3` (sportsdb) | wikiKit=#0000DD, wikiFr=#014797 |
| Troyes | `#006EB2` (sportsdb) | wikiFr=#053A95 |
| Dunkerque | `#000066` (wikiKit) | wikiFr=#142236 |
| Nancy | `#FFFFFF` (wikiKit) | wikiFr=#EC1819 |
| Red Star | `#FFFFFF` (wikiKit) | wikiFr=#054234 |
| Sochaux | `#FFFE2A` (wikiKit) | wikiFr=#004998 |
| Ipswich Town | `#3A64A3` (sportsdb) | wikiKit=#0333A0, wikiFr=#0333A0 |
| Newcastle United | `#241F20` (official) | sportsdb=#FFFFFF, wikiKit=#FFFFFF, wikiFr=#000000 |
| Alavés | `#0761AF` (official) | wikiKit=#FFFFFF, wikiFr=#0232A0 |
| Levante | `#C60B46` (sportsdb) | wikiKit=#222730, wikiFr=#00134F |
| Málaga | `#FFFFFF` (wikiKit) | wikiFr=#70B0FF |
| Valencia | `#FF671F` (sportsdb) | wikiKit=#FFFFFF, wikiFr=#FFFFFF |
| SC Freiburg | `#000000` (sportsdb) | wikiKit=#FE0000, wikiFr=#E40521 |
| SC Paderborn | `#000000` (wikiKit) | wikiFr=#1263B9 |
| Alverca | `#0000FF` (wikiKit) | wikiFr=#2F31CB |
| Braga | `#C82B20` (sportsdb) | wikiKit=#FF0000, wikiFr=#FF0005 |
| Estoril Praia | `#4C4F94` (sportsdb) | wikiKit=#FFE000, wikiFr=#FEC605 |
| Estrela da Amadora | `#BE3C2C` (sportsdb) | wikiKit=#FFFFFF, wikiFr=#F91B0F |
| Nacional | `#FFFFFF` (wikiKit) | wikiFr=#000000 |
| Rio Ave | `#009036` (sportsdb) | wikiKit=#FFFFFF, wikiFr=#2F683E |
| ADO Den Haag | `#FFFF00` (wikiKit) | wikiFr=#005219 |
| Fortuna Sittard | `#00694D` (sportsdb) | wikiKit=#FFFF00, wikiFr=#FFE21B |
| Groningen | `#000000` (wikiKit) | wikiFr=#00774D |
| Willem II | `#FFFFFF` (wikiKit) | wikiFr=#140C46 |
| Japon (JPN) | `#000080` (sportsdb) | wikiKit=#001040 |

## Une seule source (8)

| Équipe | Source unique | Primaire |
|---|---|---|
| Annecy | wikiFr | `#E30613` |
| Boulogne | wikiFr | `#D10313` |
| Grenoble | wikiFr | `#004899` |
| Pau | wikiFr | `#FFD700` |
| Saint-Étienne | wikiFr | `#139A5A` |
| Deportivo A Coruña | wikiFr | `#0033C4` |
| SV Elversberg | wikiFr | `#000000` |
| Telstar | wikiFr | `#FFFFFF` |

## Abréviations générées automatiquement (0)

Aucune.

## Classement FIFA utilisé (2026-07-20)

1. Espagne · 2. Argentine · 3. France · 4. Angleterre · 5. Brésil · 6. Maroc · 7. Portugal · 8. Belgique · 9. Pays-Bas · 10. Mexique · 11. Colombie · 12. Allemagne · 13. Croatie · 14. Suisse · 15. Italie · 16. États-Unis · 17. Japon · 18. Sénégal · 19. Norvège · 20. Uruguay · 21. Danemark · 22. Iran · 23. Autriche · 24. Égypte · 25. Équateur · 26. Nigeria · 27. Turquie · 28. Australie · 29. Algérie · 30. Canada

## Tableau complet

| Championnat | Équipe | Abr. | Ville | Primaire | Secondaire | Tertiaire | Primaire effective | Sources concordantes |
|---|---|---|---|---|---|---|---|---|
| Ligue 1 | Angers | SCO | Angers | `#000000` | `#FFFFFF` | `#D9C395` | `#000000` | sportsdb + wikiKit, wikiFr |
| Ligue 1 | Auxerre | AJA | Auxerre | `#4087BF` | `#FFFFFF` | `#121212` | `#757575` | sportsdb |
| Ligue 1 | Brest | SB29 | Brest | `#ED1C24` | `#FFFFFF` | `#000000` | `#E7121A` | sportsdb + wikiKit, wikiFr |
| Ligue 1 | Le Havre | HAC | Le Havre | `#79BCE7` | `#193260` | `#FFFFFF` | `#193260` | sportsdb + wikiKit |
| Ligue 1 | Le Mans | LMFC | Le Mans | `#FF0000` | `#FFFF00` | `#FFFFFF` | `#EB0000` | wikiKit + wikiFr |
| Ligue 1 | Lens | RCL | Lens | `#FFF200` | `#EC1C24` | `#FF0000` | `#EA141C` | sportsdb |
| Ligue 1 | Lille | LOSC | Lille | `#FE0000` | `#221F64` | `#FFFFFF` | `#EA0000` | wikiKit + wikiFr |
| Ligue 1 | Lorient | FCL | Lorient | `#F58113` | `#000000` | `#FFFFFF` | `#B45B08` | sportsdb + wikiKit, wikiFr |
| Ligue 1 | Lyon | OL | Lyon | `#FFFFFF` | `#0F23AA` | `#F40043` | `#0F23AA` | sportsdb + wikiKit |
| Ligue 1 | Marseille | OM | Marseille | `#FFFFFF` | `#2FAEE0` | `#BEA064` | `#197DA5` | official + wikiKit |
| Ligue 1 | Monaco | ASM | Monaco | `#E51B22` | `#CB9F18` | `#FFFFFF` | `#E51B22` | sportsdb + wikiKit, wikiFr |
| Ligue 1 | Nice | OGCN | Nice | `#000000` | `#ED1C24` | `#B59A54` | `#000000` | sportsdb |
| Ligue 1 | Paris FC | PFC | Paris | `#000060` | `#00AEE8` | `#87CEEB` | `#000060` | wikiKit |
| Ligue 1 | Paris Saint-Germain | PSG | Paris | `#004170` | `#DA291C` | `#FFFFFF` | `#004170` | official + wikiFr |
| Ligue 1 | Rennes | SRFC | Rennes | `#E13327` | `#000000` | `#FCBC17` | `#E02F23` | sportsdb + wikiKit, wikiFr |
| Ligue 1 | Strasbourg | RCSA | Strasbourg | `#009FE3` | `#DC2F34` | `#FFFFFF` | `#007BB0` | sportsdb |
| Ligue 1 | Toulouse | TFC | Toulouse | `#492359` | `#FFFFFF` | `#F0194E` | `#492359` | sportsdb + wikiFr |
| Ligue 1 | Troyes | TRO | Troyes | `#006EB2` | `#FFFFFF` | `#DC9D0F` | `#006EB2` | sportsdb |
| Ligue 2 | Annecy | FCA | Annecy | `#E30613` | `#FF0000` | `#FFFFFF` | `#E30613` | wikiFr |
| Ligue 2 | Boulogne | BOU | Boulogne-sur-Mer | `#D10313` | `#000000` | `#FF3232` | `#D10313` | wikiFr |
| Ligue 2 | Clermont | CF63 | Clermont-Ferrand | `#C50C46` | `#002D6A` | `#FFFFFF` | `#C50C46` | sportsdb + wikiFr |
| Ligue 2 | Dijon | DFCO | Dijon | `#FF0000` | `#FFFFFF` | `#000000` | `#EB0000` | wikiKit + wikiFr |
| Ligue 2 | Dunkerque | USLD | Dunkerque | `#000066` | `#FFFFFF` | `#990000` | `#000066` | wikiKit |
| Ligue 2 | Grenoble | GF38 | Grenoble | `#004899` | `#FFFFFF` | `#121212` | `#004899` | wikiFr |
| Ligue 2 | Guingamp | EAG | Guingamp | `#FF0000` | `#000000` | `#FFFFFF` | `#EB0000` | wikiKit + wikiFr |
| Ligue 2 | Laval | LAV | Laval | `#FF6000` | `#000000` | `#FFFFFF` | `#CC4D00` | wikiKit + wikiFr |
| Ligue 2 | Metz | FCM | Metz | `#6E0F12` | `#FFFFFF` | `#121212` | `#6E0F12` | sportsdb + wikiFr |
| Ligue 2 | Montpellier | MHSC | Montpellier | `#20234C` | `#E66107` | `#7F7D7C` | `#20234C` | sportsdb + wikiFr |
| Ligue 2 | Nancy | ASNL | Nancy | `#FFFFFF` | `#000000` | `#121212` | `#000000` | wikiKit |
| Ligue 2 | Nantes | FCN | Nantes | `#FCD405` | `#1B8F3A` | `#00B211` | `#198637` | sportsdb + wikiKit, wikiFr |
| Ligue 2 | Pau | PAU | Pau | `#FFD700` | `#191970` | `#FFFFFF` | `#8A7400` | wikiFr |
| Ligue 2 | Red Star | RSFC | Saint-Ouen | `#FFFFFF` | `#0C6646` | `#124940` | `#0C6646` | wikiKit |
| Ligue 2 | Reims | SDR | Reims | `#FF0000` | `#FFFFFF` | `#121212` | `#EB0000` | wikiKit + wikiFr |
| Ligue 2 | Rodez | RAF | Rodez | `#DD0000` | `#FCB726` | `#FFC90E` | `#DD0000` | wikiKit + wikiFr |
| Ligue 2 | Saint-Étienne | ASSE | Saint-Étienne | `#139A5A` | `#19985B` | `#FFFFFF` | `#11884F` | wikiFr |
| Ligue 2 | Sochaux | FCSM | Montbéliard | `#FFFE2A` | `#0B1031` | `#FFFFFF` | `#767600` | wikiKit |
| Premier League | Arsenal | ARS | Londres | `#EF0107` | `#FFFFFF` | `#063672` | `#EA0107` | official + sportsdb, wikiKit, wikiFr |
| Premier League | Aston Villa | AVL | Birmingham | `#670E36` | `#95BFE5` | `#FEE407` | `#670E36` | official + sportsdb, wikiKit, wikiFr |
| Premier League | Bournemouth | BOU | Bournemouth | `#DA291C` | `#000000` | `#800080` | `#DA291C` | official + sportsdb, wikiFr |
| Premier League | Brentford | BRE | Londres | `#E30613` | `#FFFFFF` | `#FBB800` | `#E30613` | official + sportsdb, wikiFr |
| Premier League | Brighton & Hove Albion | BHA | Brighton | `#0057B8` | `#FFFFFF` | `#1144DD` | `#0057B8` | official + wikiFr |
| Premier League | Chelsea | CHE | Londres | `#034694` | `#FFFFFF` | `#DBA111` | `#034694` | official + sportsdb, wikiKit |
| Premier League | Coventry City | COV | Coventry | `#77BBFF` | `#FFFFFF` | `#62B5E5` | `#0074E7` | sportsdb + wikiKit, wikiFr |
| Premier League | Crystal Palace | CRY | Londres | `#1B458F` | `#C4122E` | `#A7A5A6` | `#1B458F` | official + sportsdb, wikiFr |
| Premier League | Everton | EVE | Liverpool | `#003399` | `#FFFFFF` | `#0000FF` | `#003399` | official + sportsdb |
| Premier League | Fulham | FUL | Londres | `#FFFFFF` | `#000000` | `#CC0000` | `#121212` | official + sportsdb, wikiKit |
| Premier League | Hull City | HUL | Hull | `#F18A01` | `#000000` | `#FFFFFF` | `#AF6401` | official + sportsdb, wikiFr |
| Premier League | Ipswich Town | IPS | Ipswich | `#3A64A3` | `#DE2C37` | `#FFFFFF` | `#3A64A3` | sportsdb |
| Premier League | Leeds United | LEE | Leeds | `#FFFFFF` | `#1D428A` | `#FFCD00` | `#1D428A` | official + sportsdb |
| Premier League | Liverpool | LIV | Liverpool | `#C8102E` | `#00B2A9` | `#F6EB61` | `#C8102E` | official + sportsdb, wikiKit, wikiFr |
| Premier League | Manchester City | MCI | Manchester | `#6CABDD` | `#1C2C5B` | `#FFFFFF` | `#2B7AB8` | official + sportsdb, wikiKit, wikiFr |
| Premier League | Manchester United | MUN | Manchester | `#DA291C` | `#FBE122` | `#000000` | `#DA291C` | official + sportsdb, wikiKit, wikiFr |
| Premier League | Newcastle United | NEW | Newcastle | `#241F20` | `#FFFFFF` | `#000000` | `#241F20` | official |
| Premier League | Nottingham Forest | NFO | Nottingham | `#DD0000` | `#FFFFFF` | `#D70926` | `#DD0000` | official + wikiKit, wikiFr |
| Premier League | Sunderland | SUN | Sunderland | `#EB172B` | `#FFFFFF` | `#000000` | `#E91428` | official + sportsdb, wikiKit, wikiFr |
| Premier League | Tottenham Hotspur | TOT | Londres | `#FFFFFF` | `#132257` | `#000000` | `#132257` | official + sportsdb, wikiKit, wikiFr |
| La Liga | Alavés | ALA | Vitoria-Gasteiz | `#0761AF` | `#FFFFFF` | `#121212` | `#0761AF` | official |
| La Liga | Athletic Bilbao | ATH | Bilbao | `#EE2523` | `#FFFFFF` | `#000000` | `#EA1412` | official + sportsdb, wikiFr |
| La Liga | Atlético Madrid | ATM | Madrid | `#CB3524` | `#272E61` | `#FFFFFF` | `#CB3524` | official + sportsdb, wikiFr |
| La Liga | Barcelona | FCB | Barcelone | `#004D98` | `#A50044` | `#EDBB00` | `#004D98` | official + sportsdb |
| La Liga | Celta Vigo | CEL | Vigo | `#8AC3EE` | `#E5254E` | `#FFFFFF` | `#1C78BE` | official + sportsdb, wikiFr |
| La Liga | Deportivo A Coruña | DEP | La Corogne | `#0033C4` | `#0000FF` | `#000000` | `#0033C4` | wikiFr |
| La Liga | Elche | ELC | Elche | `#05642C` | `#FFFFFF` | `#E6C777` | `#05642C` | official + sportsdb, wikiFr |
| La Liga | Espanyol | ESP | Barcelone | `#007FC8` | `#FFFFFF` | `#DF1116` | `#0079BE` | official + sportsdb, wikiFr |
| La Liga | Getafe | GET | Getafe | `#005999` | `#C43A2F` | `#FCED0B` | `#005999` | official + sportsdb |
| La Liga | Levante | LEV | Valence | `#C60B46` | `#222730` | `#FFFFFF` | `#C60B46` | sportsdb |
| La Liga | Málaga | MAL | Malaga | `#FFFFFF` | `#103E9E` | `#121212` | `#103E9E` | wikiKit |
| La Liga | Osasuna | OSA | Pampelune | `#D91A21` | `#0A346F` | `#000000` | `#D91A21` | official + wikiFr |
| La Liga | Racing Santander | RAC | Santander | `#FFFFFF` | `#000000` | `#369028` | `#328425` | wikiKit + wikiFr |
| La Liga | Rayo Vallecano | RAY | Madrid | `#FFFFFF` | `#E53027` | `#FF0000` | `#E4271E` | official + wikiKit, wikiFr |
| La Liga | Real Betis | BET | Séville | `#00954C` | `#FFFFFF` | `#359B5C` | `#008644` | official + sportsdb, wikiKit, wikiFr |
| La Liga | Real Madrid | RMA | Madrid | `#FFFFFF` | `#FEBE10` | `#00529F` | `#00529F` | official + sportsdb, wikiKit, wikiFr |
| La Liga | Real Sociedad | RSO | Saint-Sébastien | `#0067B1` | `#FFFFFF` | `#000000` | `#0067B1` | official + sportsdb |
| La Liga | Sevilla | SEV | Séville | `#FFFFFF` | `#F43333` | `#C79100` | `#EC0D0D` | sportsdb + wikiKit |
| La Liga | Valencia | VAL | Valence | `#FF671F` | `#000000` | `#024560` | `#D14300` | sportsdb |
| La Liga | Villarreal | VIL | Villarreal | `#FFE667` | `#005187` | `#FFFF00` | `#005187` | official + wikiFr |
| Serie A | AC Milan | MIL | Milan | `#FB090B` | `#000000` | `#FFFFFF` | `#EC0406` | official + sportsdb, wikiFr |
| Serie A | Atalanta | ATA | Bergame | `#1E71B8` | `#000000` | `#FFFFFF` | `#1E71B8` | official + sportsdb, wikiFr |
| Serie A | Bologna | BOL | Bologne | `#A21C26` | `#1A2F48` | `#FFFFFF` | `#A21C26` | official + sportsdb |
| Serie A | Cagliari | CAG | Cagliari | `#002350` | `#AD002A` | `#FFFFFF` | `#002350` | official + sportsdb, wikiKit, wikiFr |
| Serie A | Como | COM | Côme | `#114169` | `#FFFFFF` | `#215AAE` | `#114169` | sportsdb + wikiKit, wikiFr |
| Serie A | Fiorentina | FIO | Florence | `#482E92` | `#FFFFFF` | `#A29160` | `#482E92` | official + sportsdb, wikiKit, wikiFr |
| Serie A | Frosinone | FRO | Frosinone | `#FFDD00` | `#004393` | `#006AB3` | `#857300` | sportsdb + wikiFr |
| Serie A | Genoa | GEN | Gênes | `#AD1919` | `#05232F` | `#FFD400` | `#AD1919` | official + sportsdb |
| Serie A | Inter Milan | INT | Milan | `#010E80` | `#000000` | `#FFFFFF` | `#010E80` | official + sportsdb, wikiFr |
| Serie A | Juventus | JUV | Turin | `#000000` | `#FFFFFF` | `#FFC9E1` | `#000000` | official + sportsdb, wikiFr |
| Serie A | Lazio | LAZ | Rome | `#87D8F7` | `#FFFFFF` | `#242D4E` | `#0B7FAC` | sportsdb + wikiKit, wikiFr |
| Serie A | Lecce | LEC | Lecce | `#FFF200` | `#ED1B23` | `#000055` | `#7F7900` | sportsdb + wikiKit |
| Serie A | Monza | MON | Monza | `#EC173A` | `#FFFFFF` | `#FF0000` | `#E61336` | sportsdb + wikiKit, wikiFr |
| Serie A | Napoli | NAP | Naples | `#12A0D7` | `#003C82` | `#FFFFFF` | `#0E7DA8` | sportsdb + wikiKit, wikiFr |
| Serie A | Parma | PAR | Parme | `#FFFFFF` | `#1B4094` | `#FFD200` | `#1B4094` | sportsdb + wikiKit, wikiFr |
| Serie A | Roma | ROM | Rome | `#8E1F2F` | `#F0BC42` | `#CACACC` | `#8E1F2F` | official + sportsdb, wikiKit, wikiFr |
| Serie A | Sassuolo | SAS | Reggio d'Émilie | `#00A752` | `#000000` | `#FFFFFF` | `#008843` | official + sportsdb, wikiKit, wikiFr |
| Serie A | Torino | TOR | Turin | `#8A1E03` | `#FFFFFF` | `#EEB111` | `#8A1E03` | official + sportsdb, wikiKit, wikiFr |
| Serie A | Udinese | UDI | Udine | `#FFFFFF` | `#000000` | `#8B7D37` | `#121212` | official + sportsdb |
| Serie A | Venezia | VEN | Venise | `#101010` | `#FF6B00` | `#006937` | `#101010` | sportsdb + wikiKit |
| Bundesliga | 1. FC Köln | KOE | Cologne | `#FFFFFF` | `#ED1C24` | `#000000` | `#E7121A` | official + wikiKit |
| Bundesliga | Bayer Leverkusen | B04 | Leverkusen | `#E32221` | `#000000` | `#FFFFFF` | `#E32221` | official + sportsdb |
| Bundesliga | Bayern Munich | BAY | Munich | `#DC052D` | `#0066B2` | `#FFFFFF` | `#DC052D` | official + sportsdb, wikiKit, wikiFr |
| Bundesliga | Borussia Dortmund | BVB | Dortmund | `#FDE100` | `#000000` | `#FFFFFF` | `#121212` | official + sportsdb, wikiKit, wikiFr |
| Bundesliga | Borussia Mönchengladbach | BMG | Mönchengladbach | `#000000` | `#FFFFFF` | `#121212` | `#000000` | official + sportsdb, wikiFr |
| Bundesliga | Eintracht Frankfurt | SGE | Francfort | `#E1000F` | `#000000` | `#FFFFFF` | `#E1000F` | official + sportsdb, wikiFr |
| Bundesliga | FC Augsburg | FCA | Augsbourg | `#BA3733` | `#46714D` | `#FFFFFF` | `#BA3733` | official + sportsdb, wikiFr |
| Bundesliga | Hamburger SV | HSV | Hambourg | `#0A3F86` | `#FFFFFF` | `#FF0000` | `#0A3F86` | official + sportsdb, wikiFr |
| Bundesliga | Mainz 05 | M05 | Mayence | `#ED1C24` | `#FFFFFF` | `#918F90` | `#E7121A` | official + sportsdb, wikiKit, wikiFr |
| Bundesliga | RB Leipzig | RBL | Leipzig | `#DD0741` | `#FFFFFF` | `#001F47` | `#DD0741` | official + sportsdb |
| Bundesliga | SC Freiburg | SCF | Fribourg-en-Brisgau | `#000000` | `#FFFFFF` | `#FD1220` | `#000000` | sportsdb |
| Bundesliga | SC Paderborn | PAD | Paderborn | `#000000` | `#FFFFFF` | `#FF0000` | `#000000` | wikiKit |
| Bundesliga | Schalke 04 | S04 | Gelsenkirchen | `#004D9D` | `#FFFFFF` | `#0000DD` | `#004D9D` | official + sportsdb, wikiFr |
| Bundesliga | SV Elversberg | SVE | Spiesen-Elversberg | `#000000` | `#D3BF8D` | `#FFFFFF` | `#000000` | wikiFr |
| Bundesliga | TSG Hoffenheim | TSG | Sinsheim | `#1961B5` | `#FFFFFF` | `#0000FF` | `#1961B5` | official + sportsdb, wikiFr |
| Bundesliga | Union Berlin | FCU | Berlin | `#EB1923` | `#FFFFFF` | `#FDDC02` | `#EB141F` | official + sportsdb, wikiKit, wikiFr |
| Bundesliga | VfB Stuttgart | VFB | Stuttgart | `#E32219` | `#FFFFFF` | `#FFED00` | `#E32219` | official + sportsdb |
| Bundesliga | Werder Bremen | SVW | Brême | `#1D9053` | `#FFFFFF` | `#009A59` | `#1A834C` | official + sportsdb, wikiFr |
| Liga Portugal | Académico de Viseu | AVI | Viseu | `#000000` | `#FFFFFF` | `#121212` | `#000000` | wikiKit + wikiFr |
| Liga Portugal | Alverca | ALV | Alverca do Ribatejo | `#0000FF` | `#FFFFFF` | `#121212` | `#0000FF` | wikiKit |
| Liga Portugal | Arouca | ARO | Arouca | `#FEF405` | `#024CAB` | `#0000FF` | `#7E7901` | sportsdb + wikiKit, wikiFr |
| Liga Portugal | Benfica | SLB | Lisbonne | `#E83030` | `#FFFFFF` | `#000000` | `#E62222` | official + sportsdb, wikiKit, wikiFr |
| Liga Portugal | Braga | SCB | Braga | `#C82B20` | `#868257` | `#FFFFFF` | `#C82B20` | sportsdb |
| Liga Portugal | Casa Pia | CPA | Lisbonne | `#000000` | `#E40B1E` | `#FFFFFF` | `#000000` | sportsdb + wikiKit, wikiFr |
| Liga Portugal | Estoril Praia | EST | Estoril | `#4C4F94` | `#FFE302` | `#0097D9` | `#4C4F94` | sportsdb |
| Liga Portugal | Estrela da Amadora | EAM | Amadora | `#BE3C2C` | `#3D8F47` | `#FFFFFF` | `#BE3C2C` | sportsdb |
| Liga Portugal | Famalicão | FAM | Vila Nova de Famalicão | `#FFFFFF` | `#0B3D6B` | `#F0C61C` | `#0B3D6B` | sportsdb + wikiKit |
| Liga Portugal | Gil Vicente | GIL | Barcelos | `#D52929` | `#083363` | `#FFFFFF` | `#D52929` | sportsdb + wikiKit, wikiFr |
| Liga Portugal | Marítimo | MAR | Funchal | `#FF0000` | `#FFFFFF` | `#000044` | `#EB0000` | wikiKit + wikiFr |
| Liga Portugal | Moreirense | MOR | Moreira de Cónegos | `#145F25` | `#FFFFFF` | `#AF9713` | `#145F25` | sportsdb + wikiFr |
| Liga Portugal | Nacional | NAC | Funchal | `#FFFFFF` | `#000000` | `#FFE000` | `#857400` | wikiKit |
| Liga Portugal | Porto | FCP | Porto | `#00428C` | `#FFFFFF` | `#D60019` | `#00428C` | sportsdb + wikiFr |
| Liga Portugal | Rio Ave | RAV | Vila do Conde | `#009036` | `#FFFFFF` | `#F08A00` | `#008632` | sportsdb |
| Liga Portugal | Santa Clara | SCL | Ponta Delgada | `#FF0000` | `#FFFFFF` | `#000055` | `#EB0000` | wikiKit + wikiFr |
| Liga Portugal | Sporting CP | SCP | Lisbonne | `#008057` | `#FFFFFF` | `#F3C242` | `#008057` | sportsdb + wikiFr |
| Liga Portugal | Vitória de Guimarães | VSC | Guimarães | `#FFFFFF` | `#000000` | `#121212` | `#000000` | sportsdb + wikiKit |
| Eredivisie | ADO Den Haag | ADO | La Haye | `#FFFF00` | `#FFDD00` | `#000000` | `#7A7A00` | wikiKit |
| Eredivisie | Ajax | AJX | Amsterdam | `#D2122E` | `#FFFFFF` | `#000000` | `#D2122E` | official + sportsdb, wikiFr |
| Eredivisie | AZ | AZ | Alkmaar | `#DB0021` | `#FFFFFF` | `#0032FC` | `#DB0021` | sportsdb + wikiKit, wikiFr |
| Eredivisie | Cambuur | CAM | Leeuwarden | `#FFEE00` | `#0000FF` | `#888888` | `#7F7700` | wikiKit + wikiFr |
| Eredivisie | Excelsior | EXC | Rotterdam | `#000000` | `#E2001A` | `#FF0000` | `#000000` | sportsdb + wikiKit, wikiFr |
| Eredivisie | Feyenoord | FEY | Rotterdam | `#E2001A` | `#FFFFFF` | `#AE9962` | `#E2001A` | sportsdb + wikiFr |
| Eredivisie | Fortuna Sittard | FOR | Sittard | `#00694D` | `#FFE404` | `#FFFFFF` | `#00694D` | sportsdb |
| Eredivisie | Go Ahead Eagles | GAE | Deventer | `#C10130` | `#FFD700` | `#FFFFFF` | `#C10130` | sportsdb + wikiFr |
| Eredivisie | Groningen | GRO | Groningue | `#000000` | `#FFFFFF` | `#121212` | `#000000` | wikiKit |
| Eredivisie | Heerenveen | HEE | Heerenveen | `#004485` | `#FFFFFF` | `#E8363C` | `#004485` | sportsdb + wikiFr |
| Eredivisie | N.E.C. | NEC | Nimègue | `#ED1B24` | `#159A6F` | `#080808` | `#EB131C` | sportsdb + wikiKit, wikiFr |
| Eredivisie | PEC Zwolle | PEC | Zwolle | `#1E59AE` | `#6AC2EE` | `#EF2C30` | `#1E59AE` | sportsdb + wikiFr |
| Eredivisie | PSV | PSV | Eindhoven | `#ED1C24` | `#FFFFFF` | `#BB955E` | `#E7121A` | official + sportsdb, wikiFr |
| Eredivisie | Sparta Rotterdam | SPA | Rotterdam | `#D91D38` | `#FFFFFF` | `#000000` | `#D91D38` | sportsdb + wikiFr |
| Eredivisie | Telstar | TEL | Velsen | `#FFFFFF` | `#016DB7` | `#1B3359` | `#016DB7` | wikiFr |
| Eredivisie | Twente | TWE | Enschede | `#E6001A` | `#FFFFFF` | `#FF0000` | `#E6001A` | sportsdb + wikiKit, wikiFr |
| Eredivisie | Utrecht | UTR | Utrecht | `#D82333` | `#FFFFFF` | `#000000` | `#D82333` | sportsdb + wikiKit, wikiFr |
| Eredivisie | Willem II | WIL | Tilburg | `#FFFFFF` | `#121212` | `#121212` | `#121212` | wikiKit |
| Sélections | Espagne (ESP) | ESP | Espagne | `#C60B1E` | `#FFC400` | `#FFFFFF` | `#C60B1E` | official + sportsdb, wikiKit |
| Sélections | Argentine (ARG) | ARG | Argentine | `#74ACDF` | `#FFFFFF` | `#F6B40E` | `#2C7AC1` | official + sportsdb |
| Sélections | France (FRA) | FRA | France | `#21304D` | `#ED2939` | `#FFFFFF` | `#21304D` | sportsdb + wikiKit |
| Sélections | Angleterre (ENG) | ENG | Angleterre | `#FFFFFF` | `#5AADD6` | `#181B3A` | `#297DA6` | sportsdb + wikiKit |
| Sélections | Brésil (BRA) | BRA | Brésil | `#FFDF00` | `#009C3B` | `#002776` | `#008833` | official + sportsdb, wikiKit |
| Sélections | Maroc (MAR) | MAR | Maroc | `#C1272D` | `#006233` | `#D29D63` | `#C1272D` | official + sportsdb |
| Sélections | Portugal (POR) | POR | Portugal | `#FF0000` | `#006600` | `#FFFFFF` | `#EB0000` | official + sportsdb |
| Sélections | Belgique (BEL) | BEL | Belgique | `#E30613` | `#FFD500` | `#000000` | `#E30613` | sportsdb + wikiKit |
| Sélections | Pays-Bas (NED) | NED | Pays-Bas | `#F36C21` | `#FFFFFF` | `#000000` | `#C74E0B` | sportsdb + wikiKit |
| Sélections | Mexique (MEX) | MEX | Mexique | `#006847` | `#FFFFFF` | `#CE1126` | `#006847` | official + wikiKit |
| Sélections | Colombie (COL) | COL | Colombie | `#FCD116` | `#003893` | `#CE1126` | `#003893` | official + wikiKit |
| Sélections | Allemagne (GER) | GER | Allemagne | `#FFFFFF` | `#000000` | `#DD0000` | `#121212` | official + sportsdb, wikiKit |
| Sélections | Croatie (CRO) | CRO | Croatie | `#FF0000` | `#FFFFFF` | `#171796` | `#EB0000` | official + sportsdb |
| Sélections | Suisse (SUI) | SUI | Suisse | `#FF0000` | `#FFFFFF` | `#740C14` | `#EB0000` | sportsdb + wikiKit |
| Sélections | Italie (ITA) | ITA | Italie | `#1A57B8` | `#FFFFFF` | `#0048BA` | `#1A57B8` | sportsdb + wikiKit |
| Sélections | États-Unis (USA) | USA | États-Unis | `#002868` | `#BF0A30` | `#FFFFFF` | `#002868` | official + sportsdb |
| Sélections | Japon (JPN) | JPN | Japon | `#000080` | `#FFFFFF` | `#001040` | `#000080` | sportsdb |
| Sélections | Sénégal (SEN) | SEN | Sénégal | `#00853F` | `#FDEF42` | `#E31B23` | `#00853F` | official + sportsdb |
| Sélections | Norvège (NOR) | NOR | Norvège | `#BA0C2F` | `#00205B` | `#FFFFFF` | `#BA0C2F` | official + wikiKit |
| Sélections | Uruguay (URU) | URU | Uruguay | `#55B5E5` | `#FFFFFF` | `#000000` | `#1B7EAF` | sportsdb + wikiKit |
| Sélections | Danemark (DEN) | DEN | Danemark | `#C8102E` | `#FFFFFF` | `#FF0000` | `#C8102E` | official + sportsdb |
| Sélections | Iran (IRN) | IRN | Iran | `#FFFFFF` | `#239F40` | `#DA0000` | `#1D8636` | official + wikiKit |
| Sélections | Autriche (AUT) | AUT | Autriche | `#ED2939` | `#FFFFFF` | `#000000` | `#E91425` | official + wikiKit |
| Sélections | Égypte (EGY) | EGY | Égypte | `#CE1126` | `#FFFFFF` | `#000000` | `#CE1126` | official + sportsdb, wikiKit |
| Sélections | Équateur (ECU) | ECU | Équateur | `#FFDD00` | `#034EA2` | `#ED1C24` | `#034EA2` | official + sportsdb, wikiKit |
| Sélections | Nigeria (NGA) | NGA | Nigeria | `#008751` | `#FFFFFF` | `#009B68` | `#008751` | official + sportsdb |
| Sélections | Turquie (TUR) | TUR | Turquie | `#E30A17` | `#FFFFFF` | `#FF0000` | `#E30A17` | official + wikiKit |
| Sélections | Australie (AUS) | AUS | Australie | `#FFCD00` | `#00843D` | `#07563E` | `#00843D` | official + sportsdb, wikiKit |
| Sélections | Algérie (ALG) | ALG | Algérie | `#006233` | `#FFFFFF` | `#D21034` | `#006233` | official + sportsdb |
| Sélections | Canada (CAN) | CAN | Canada | `#FF0000` | `#FFFFFF` | `#000000` | `#EB0000` | official + wikiKit |

## Régénérer

```bash
npm run teams:build                 # = node scripts/scrape-teams.mjs (saison 2026-27, cache activé)
node scripts/scrape-teams.mjs --season 2027-28 --no-cache
```

Pour ajouter ou corriger une équipe : compléter `scripts/data/official-colors.json` (couleur officielle), `scripts/data/overrides.json` (override documenté) ou `scripts/data/aliases.json` (nom TheSportsDB, abréviation, ville, nom français), puis relancer.
