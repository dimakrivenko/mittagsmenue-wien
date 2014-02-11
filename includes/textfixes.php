<?php

$explodeNewLines = array(
	"\n", '<br >', '<br>', '<br/>', '<br />', '< br>', '< br>',
	'< br/>', '< br >', '< br />'
);

$cacheDataExplode = array_merge($explodeNewLines, array(
	'(', ')', ' und ', ' oder ', ' mit ', ' auf ', ' & ', ' in ', ' - ', ' im ', '“', '"', '„', '\'',
	':', ',', ' dazu ', ' trifft ', 'geriebenem', ' vom ', ' aus ', ' von ', ' nach ',
	'gefüllten', 'gefüllter', 'gefüllte', 'gefüllt', 'überbackener', 'Überbackene', 'überbackene', 'überbacken', 'gehobeltem',
	'nicht scharf', 'frischen', 'frischem', 'frischer', 'frische', 'u.', 'bei schlechtwetter', ' der ', 'süß-würziger', 'würziger', 'würzige',
	'gebratenen', 'gebratenes', 'gebratenem', 'gebratener', 'gebratene', 'dem', 'warmen', 'warmer', 'warm', 'milder',
	'gemischter', 'gemischten', 'gemischtem', 'gemischte', 'gemischt', 'gegrillter', 'gegrilltem', 'gegrillten',
	'gegrilltes', 'gegrillte', 'hausgemachter', 'hausgemachten', 'hausgemachtes', 'hausgemachte', 'saftiges', 'buntes',
	'gebackenen', 'gebackener', 'gebackenes', 'gebackene', 'gebacken', 'gezogener', 'gemischtes', 'pikanter', 'pikantes', 'pikante', 'geröstetem', 'geröstetes',
	'gerösteten', 'gerösteter', 'geröstete', 'geriebenen', 'gehacktes', 'geschmortes', 'getrockneten', 'gekochtem', 'gekochtes', 'gekochter', 'gekocht',
	'ofenwarmer', 'wiener', ' mexikanisches', 'französische', '| veg', 'WOKSPEZIALITÄT', 'tewas', ' -',
));
$cacheDataIgnore = array('1.', '2.', '3.', '4.');

$cacheDataDelete = array(
	'!!!', 'feiertag', 'Feiertag', 'FEIERTAG', 'Feiertagsbrunch',
	'Genussregion Tullnerfelder Schwein', 'la carte', 'geschlossen',
	'Geschlossen', 'Silvester', 'Neujahr', 'FROHE', 'OSTERN', 'CHRISTI',
	'HIMMELFAHRT', 'GESCHLOSSEN', 'Heiliger Abend',
);

$searchReplace = array(
	'dazu &' => 'dazu',
	'TikkaMasala' => 'Tikka Masala',
	'gegrilltes Hühnerfilets' => 'Gegrilltes Hühnerfilet',
	'gegrillte Hühnerfilets' => 'Gegrilltes Hühnerfilet',
	'gegrilltes Hühnerfilets' => 'Gegrilltes Hühnerfilet',
	'Cashewnuss – Mandel – Obersauce' => 'Cashewnuss-Mandel-Oberssauce',
	'milder-Currysauce' => 'milder Currysauce',
	'in milde Currysauce' => 'in milder Currysauce',
	'milde-Currysauce' => 'milder Currysauce',
	'Murgh saag' => 'Murgh Saag',
	'Murhg' => 'Murgh',
	'Gemüse bällchan' => 'Gemüsebällchen',
	'Würziger Currysauce' => 'würziger Currysauce',
	' :' => ':',
	'Curryemüse' => 'Currygemüse',
	'Kokos-Ober-Sauce' => 'Kokos-Obers-Sauce',
	'kokos-Obers-Sauce' => 'Kokos-Obers-Sauce',
	'Hausgemachter' => 'hausgemachter',
	'Gewürsen' => 'Gewürzen',
	'mit Spinatsauce' => 'in Spinatsauce',
	'currysauce' => 'Currysauce',
	'Frisches Karfiol' => 'Frischer Karfiol',
	'Pikaner Currysauce' => 'pikanter Currysauce',
	'würziger Currysauce' => 'Currysauce',
	'Genüse' => 'Gemüse',
	'Lach ' => 'Lachs ',
	'Schnitlauch' => 'Schnittlauch',
	'Eiernockelr' => 'Eiernockerl',
	'Rosti' => 'Rösti',
	'Speckfi sollen' => 'Speckfisolen',
	'Thunfi sch' => 'Thunfisch',
	'Steinpilztaschrln' => 'Steinpilztascherln',
	'cremsuppe' => 'cremesuppe',
	'Gemuse' => 'Gemüse',
	'Szedediner' => 'Szegediner',
	'cemesuppe' => 'cremesuppe',
	'Wurstrfleckerl' => 'Wurstfleckerl',
	'Spare Rips' => 'Spareribs',
	'Gegrillte Hühnerfilet' => 'Gegrilltes Hühnerfilet',
	'Majonnaise' => 'Mayonnaise',
	'Ingwer,Knoblauch' => 'Ingwer, Knoblauch',
	'Paprika.Zwiebel' => 'Paprika, Zwiebel',
	'Zwiebel,Ingwer' => 'Zwiebel, Ingwer',
	'Giegrilltes' => 'Gegrilltes',
	'mit &' => '&',
	'und &' => 'und',
	'( ' => '(',
	' )' => ')',
	'Gerbratene' => 'Gebratene',
	'Obersauce' => 'Oberssauce',
	'Kartoffeln,Knoblauch' => 'Kartoffeln, Knoblauch',
	'Gegrilltes Hühnerfilets' => 'Gegrilltes Hühnerfleisch',
	'-Hühnerfleisch' => 'Hühnerfleisch',
	'masalasauce' => 'Masalasauce',
	'Bio Spaghetti' => 'Bio-Spaghetti',
	'Geröstetet' => 'Geröstete',
	'Seafood Pie -' => 'Seafood Pie',
	'1 ' => '1. ',
	'2 ' => '2. ',
	'3 ' => '3. ',
	'4 ' => '4. ',
	'Artischokensalat' => 'Artischockensalat',
	'Gegrille' => 'Gegrillte',
	'Szegendiner Krautfleisch' => 'Szegediner Krautfleisch',
	'Chili con carne' => 'Chili con Carne',
	'Schweinsrükcesteak' => 'Schweinsrückensteak',
	'khohl' => 'kohl',
	'Ptersil' => 'Petersil',
	'Gemüseuppe' => 'Gemüsesuppe',
	' , ' => ', ',
	'1/2.' => '1/2', // haas beisl "1/2. brathuhn" fix, because "2." is not allowed
	'gemichtem' => 'gemischtem',
	'Schafskäse&Blattspinat' => 'Schafskäse & Blattspinat',
);

?>
