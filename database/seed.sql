-- App Pontos — dados iniciais (planos + catalogo de itens de avatar)
-- Equivalente aos scripts src/seed/plans.ts e src/seed/avatarItems.ts do backend Node.
-- Idempotente: pode ser executado novamente sem duplicar registros.

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------
INSERT INTO plans (id, name, type, price, currency, billing_interval, max_students, max_classrooms, features, is_active)
VALUES
  ('plan-gratuito', 'Gratuito', 'GRATUITO', 0.00, 'BRL', 'month', 30, 1,
   JSON_ARRAY('Até 30 alunos', '1 turma', 'Sistema de pontos básico', 'Avatares básicos', 'Ranking simples'), 1),
  ('plan-pro', 'Pro', 'PRO', 29.90, 'BRL', 'month', 150, NULL,
   JSON_ARRAY('Até 150 alunos', 'Turmas ilimitadas', 'Sistema de pontos avançado', 'Avatares premium', 'Relatórios detalhados', 'Badges e conquistas', 'Suporte prioritário'), 1),
  ('plan-escola', 'Escola', 'ESCOLA', 199.90, 'BRL', 'month', NULL, NULL,
   JSON_ARRAY('Alunos ilimitados', 'Professores ilimitados', 'Dashboard administrativo', 'Relatórios institucionais', 'API personalizada', 'Suporte dedicado', 'Treinamento incluído'), 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  max_students = VALUES(max_students),
  max_classrooms = VALUES(max_classrooms),
  features = VALUES(features),
  is_active = VALUES(is_active);

-- ---------------------------------------------------------------------------
-- Avatar items (catalogo). IDs no formato "seed-<type>-<value>" (minusculo),
-- igual ao gerado pelo script Node original, para que os avatarItems criados
-- por padrão em createStudent (ver StudentController::create) continuem
-- apontando para IDs existentes.
-- ---------------------------------------------------------------------------
INSERT INTO avatar_items (id, type, value, display_name, cost_points, is_default) VALUES
('seed-avatarstyle-circle', 'avatarStyle', 'Circle', 'Círculo', 0, 1),
('seed-avatarstyle-transparent', 'avatarStyle', 'Transparent', 'Transparente', 0, 1),

('seed-toptype-nohair', 'topType', 'NoHair', 'Careca', 0, 1),
('seed-toptype-eyepatch', 'topType', 'Eyepatch', 'Tapa-olho', 50, 0),
('seed-toptype-hat', 'topType', 'Hat', 'Chapéu', 30, 0),
('seed-toptype-hijab', 'topType', 'Hijab', 'Hijab', 0, 1),
('seed-toptype-turban', 'topType', 'Turban', 'Turbante', 20, 0),
('seed-toptype-winterhat1', 'topType', 'WinterHat1', 'Gorro de Inverno 1', 25, 0),
('seed-toptype-winterhat2', 'topType', 'WinterHat2', 'Gorro de Inverno 2', 25, 0),
('seed-toptype-winterhat3', 'topType', 'WinterHat3', 'Gorro de Inverno 3', 25, 0),
('seed-toptype-winterhat4', 'topType', 'WinterHat4', 'Gorro de Inverno 4', 25, 0),
('seed-toptype-longhairbighair', 'topType', 'LongHairBigHair', 'Cabelo Longo Volumoso', 15, 0),
('seed-toptype-longhairbob', 'topType', 'LongHairBob', 'Cabelo Longo Bob', 10, 0),
('seed-toptype-longhairbun', 'topType', 'LongHairBun', 'Cabelo Longo Coque', 10, 0),
('seed-toptype-longhaircurly', 'topType', 'LongHairCurly', 'Cabelo Longo Cacheado', 15, 0),
('seed-toptype-longhaircurvy', 'topType', 'LongHairCurvy', 'Cabelo Longo Ondulado', 15, 0),
('seed-toptype-longhairdreads', 'topType', 'LongHairDreads', 'Cabelo Longo Dreads', 20, 0),
('seed-toptype-longhairfrida', 'topType', 'LongHairFrida', 'Cabelo Longo Frida', 30, 0),
('seed-toptype-longhairfro', 'topType', 'LongHairFro', 'Cabelo Longo Afro', 20, 0),
('seed-toptype-longhairfroband', 'topType', 'LongHairFroBand', 'Cabelo Longo Afro com Faixa', 25, 0),
('seed-toptype-longhairnottoolong', 'topType', 'LongHairNotTooLong', 'Cabelo Médio', 10, 0),
('seed-toptype-longhairshavedsides', 'topType', 'LongHairShavedSides', 'Cabelo Longo Lados Raspados', 25, 0),
('seed-toptype-longhairmiawallace', 'topType', 'LongHairMiaWallace', 'Cabelo Mia Wallace', 20, 0),
('seed-toptype-longhairstraight', 'topType', 'LongHairStraight', 'Cabelo Longo Liso 1', 10, 0),
('seed-toptype-longhairstraight2', 'topType', 'LongHairStraight2', 'Cabelo Longo Liso 2', 10, 0),
('seed-toptype-longhairstraightstrand', 'topType', 'LongHairStraightStrand', 'Cabelo Longo Liso com Mecha', 15, 0),
('seed-toptype-shorthairdreads01', 'topType', 'ShortHairDreads01', 'Cabelo Curto Dreads 1', 15, 0),
('seed-toptype-shorthairdreads02', 'topType', 'ShortHairDreads02', 'Cabelo Curto Dreads 2', 15, 0),
('seed-toptype-shorthairfrizzle', 'topType', 'ShortHairFrizzle', 'Cabelo Curto Frisado', 10, 0),
('seed-toptype-shorthairshaggymullet', 'topType', 'ShortHairShaggyMullet', 'Cabelo Shaggy Mullet', 20, 0),
('seed-toptype-shorthairshortcurly', 'topType', 'ShortHairShortCurly', 'Cabelo Curto Cacheado', 10, 0),
('seed-toptype-shorthairshortflat', 'topType', 'ShortHairShortFlat', 'Cabelo Curto Liso', 0, 1),
('seed-toptype-shorthairshortround', 'topType', 'ShortHairShortRound', 'Cabelo Curto Arredondado', 10, 0),
('seed-toptype-shorthairshortwaved', 'topType', 'ShortHairShortWaved', 'Cabelo Curto Ondulado', 10, 0),
('seed-toptype-shorthairsides', 'topType', 'ShortHairSides', 'Cabelo Curto Lados', 5, 0),
('seed-toptype-shorthairthecaesar', 'topType', 'ShortHairTheCaesar', 'Cabelo Caesar', 15, 0),
('seed-toptype-shorthairthecaesarsidepart', 'topType', 'ShortHairTheCaesarSidePart', 'Cabelo Caesar com Partida', 15, 0),

('seed-accessoriestype-blank', 'accessoriesType', 'Blank', 'Nenhum', 0, 1),
('seed-accessoriestype-kurt', 'accessoriesType', 'Kurt', 'Kurt', 40, 0),
('seed-accessoriestype-prescription01', 'accessoriesType', 'Prescription01', 'Grau 1', 10, 0),
('seed-accessoriestype-prescription02', 'accessoriesType', 'Prescription02', 'Grau 2', 10, 0),
('seed-accessoriestype-round', 'accessoriesType', 'Round', 'Redondo', 20, 0),
('seed-accessoriestype-sunglasses', 'accessoriesType', 'Sunglasses', 'Escuro', 50, 0),
('seed-accessoriestype-wayfarers', 'accessoriesType', 'Wayfarers', 'Wayfarers', 40, 0),

('seed-facialhairtype-blank', 'facialHairType', 'Blank', 'Nenhum', 0, 1),
('seed-facialhairtype-beardmedium', 'facialHairType', 'BeardMedium', 'Barba Média', 20, 0),
('seed-facialhairtype-beardlight', 'facialHairType', 'BeardLight', 'Barba Leve', 15, 0),
('seed-facialhairtype-beardmajestic', 'facialHairType', 'BeardMajestic', 'Barba Majestosa', 40, 0),
('seed-facialhairtype-moustachefancy', 'facialHairType', 'MoustacheFancy', 'Bigode Chique', 30, 0),
('seed-facialhairtype-moustachemagnum', 'facialHairType', 'MoustacheMagnum', 'Bigode Magnum', 25, 0),

('seed-clothetype-blazershirt', 'clotheType', 'BlazerShirt', 'Blazer com Camisa', 40, 0),
('seed-clothetype-blazersweater', 'clotheType', 'BlazerSweater', 'Blazer com Suéter', 35, 0),
('seed-clothetype-collarsweater', 'clotheType', 'CollarSweater', 'Suéter com Gola', 20, 0),
('seed-clothetype-graphicshirt', 'clotheType', 'GraphicShirt', 'Camisa Estampada', 25, 0),
('seed-clothetype-hoodie', 'clotheType', 'Hoodie', 'Moletom', 0, 1),
('seed-clothetype-overall', 'clotheType', 'Overall', 'Macacão', 30, 0),
('seed-clothetype-shirtcrewneck', 'clotheType', 'ShirtCrewNeck', 'Camisa Gola Careca', 0, 1),
('seed-clothetype-shirtscoopneck', 'clotheType', 'ShirtScoopNeck', 'Camisa Gola U', 10, 0),
('seed-clothetype-shirtvneck', 'clotheType', 'ShirtVNeck', 'Camisa Gola V', 10, 0),

('seed-eyetype-close', 'eyeType', 'Close', 'Fechado', 0, 1),
('seed-eyetype-cry', 'eyeType', 'Cry', 'Choro', 0, 1),
('seed-eyetype-default', 'eyeType', 'Default', 'Padrão', 0, 1),
('seed-eyetype-dizzy', 'eyeType', 'Dizzy', 'Tonto', 0, 1),
('seed-eyetype-eyeroll', 'eyeType', 'EyeRoll', 'Revirando Olhos', 0, 1),
('seed-eyetype-happy', 'eyeType', 'Happy', 'Feliz', 0, 1),
('seed-eyetype-hearts', 'eyeType', 'Hearts', 'Corações', 0, 1),
('seed-eyetype-side', 'eyeType', 'Side', 'Lado', 0, 1),
('seed-eyetype-squint', 'eyeType', 'Squint', 'Semicerrado', 0, 1),
('seed-eyetype-surprised', 'eyeType', 'Surprised', 'Surpreso', 0, 1),
('seed-eyetype-wink', 'eyeType', 'Wink', 'Piscadela', 0, 1),
('seed-eyetype-winkwacky', 'eyeType', 'WinkWacky', 'Piscadela Maluca', 0, 1),

('seed-mouthtype-concerned', 'mouthType', 'Concerned', 'Preocupado', 0, 1),
('seed-mouthtype-disbelief', 'mouthType', 'Disbelief', 'Descrença', 0, 1),
('seed-mouthtype-eating', 'mouthType', 'Eating', 'Comendo', 0, 1),
('seed-mouthtype-grimace', 'mouthType', 'Grimace', 'Careta', 0, 1),
('seed-mouthtype-screamopen', 'mouthType', 'ScreamOpen', 'Grito', 0, 1),
('seed-mouthtype-serious', 'mouthType', 'Serious', 'Sério', 0, 1),
('seed-mouthtype-smile', 'mouthType', 'Smile', 'Sorriso', 0, 1),
('seed-mouthtype-tongue', 'mouthType', 'Tongue', 'Língua', 0, 1),
('seed-mouthtype-twinkle', 'mouthType', 'Twinkle', 'Brilho', 0, 1),
('seed-mouthtype-vomit', 'mouthType', 'Vomit', 'Vômito', 0, 1),

('seed-skincolor-tanned', 'skinColor', 'Tanned', 'Bronzeado', 0, 1),
('seed-skincolor-yellow', 'skinColor', 'Yellow', 'Amarelo', 0, 1),
('seed-skincolor-pale', 'skinColor', 'Pale', 'Pálido', 0, 1),
('seed-skincolor-light', 'skinColor', 'Light', 'Claro', 0, 1),
('seed-skincolor-brown', 'skinColor', 'Brown', 'Marrom', 0, 1),
('seed-skincolor-darkbrown', 'skinColor', 'DarkBrown', 'Marrom Escuro', 0, 1),
('seed-skincolor-black', 'skinColor', 'Black', 'Preto', 0, 1),

('seed-haircolor-auburn', 'hairColor', 'Auburn', 'Ruivo Escuro', 0, 1),
('seed-haircolor-black', 'hairColor', 'Black', 'Preto', 0, 1),
('seed-haircolor-blonde', 'hairColor', 'Blonde', 'Loiro', 0, 1),
('seed-haircolor-blondegolden', 'hairColor', 'BlondeGolden', 'Loiro Dourado', 0, 1),
('seed-haircolor-brown', 'hairColor', 'Brown', 'Castanho', 0, 1),
('seed-haircolor-browndark', 'hairColor', 'BrownDark', 'Castanho Escuro', 0, 1),
('seed-haircolor-pastelpink', 'hairColor', 'PastelPink', 'Rosa Pastel', 30, 0),
('seed-haircolor-platinum', 'hairColor', 'Platinum', 'Platinado', 30, 0),
('seed-haircolor-red', 'hairColor', 'Red', 'Vermelho', 20, 0),
('seed-haircolor-silvergray', 'hairColor', 'SilverGray', 'Cinza Prateado', 20, 0),

('seed-clothecolor-black', 'clotheColor', 'Black', 'Preto', 0, 1),
('seed-clothecolor-blue01', 'clotheColor', 'Blue01', 'Azul 1', 0, 1),
('seed-clothecolor-blue02', 'clotheColor', 'Blue02', 'Azul 2', 0, 1),
('seed-clothecolor-blue03', 'clotheColor', 'Blue03', 'Azul 3', 0, 1),
('seed-clothecolor-gray01', 'clotheColor', 'Gray01', 'Cinza 1', 0, 1),
('seed-clothecolor-gray02', 'clotheColor', 'Gray02', 'Cinza 2', 0, 1),
('seed-clothecolor-heather', 'clotheColor', 'Heather', 'Mescla', 10, 0),
('seed-clothecolor-pastelblue', 'clotheColor', 'PastelBlue', 'Azul Pastel', 20, 0),
('seed-clothecolor-pastelgreen', 'clotheColor', 'PastelGreen', 'Verde Pastel', 20, 0),
('seed-clothecolor-pastelorange', 'clotheColor', 'PastelOrange', 'Laranja Pastel', 20, 0),
('seed-clothecolor-pastelred', 'clotheColor', 'PastelRed', 'Vermelho Pastel', 20, 0),
('seed-clothecolor-pastelyellow', 'clotheColor', 'PastelYellow', 'Amarelo Pastel', 20, 0),
('seed-clothecolor-pink', 'clotheColor', 'Pink', 'Rosa', 20, 0),
('seed-clothecolor-red', 'clotheColor', 'Red', 'Vermelho', 10, 0),
('seed-clothecolor-white', 'clotheColor', 'White', 'Branco', 0, 1),

('seed-eyebrowtype-angry', 'eyebrowType', 'Angry', 'Bravo', 15, 0),
('seed-eyebrowtype-angrynatural', 'eyebrowType', 'AngryNatural', 'Bravo Natural', 15, 0),
('seed-eyebrowtype-default', 'eyebrowType', 'Default', 'Padrão', 0, 1),
('seed-eyebrowtype-defaultnatural', 'eyebrowType', 'DefaultNatural', 'Padrão Natural', 0, 1),
('seed-eyebrowtype-flatnatural', 'eyebrowType', 'FlatNatural', 'Reto Natural', 10, 0),
('seed-eyebrowtype-raisedexcited', 'eyebrowType', 'RaisedExcited', 'Levantado Animado', 15, 0),
('seed-eyebrowtype-raisedexcitednatural', 'eyebrowType', 'RaisedExcitedNatural', 'Levantado Animado Natural', 15, 0),
('seed-eyebrowtype-sadconcerned', 'eyebrowType', 'SadConcerned', 'Triste Preocupado', 15, 0),
('seed-eyebrowtype-sadconcernednatural', 'eyebrowType', 'SadConcernedNatural', 'Triste Preocupado Natural', 15, 0),
('seed-eyebrowtype-unibrownatural', 'eyebrowType', 'UnibrowNatural', 'Monocelha Natural', 20, 0),
('seed-eyebrowtype-updown', 'eyebrowType', 'UpDown', 'Para Cima e Para Baixo', 15, 0),
('seed-eyebrowtype-updownnatural', 'eyebrowType', 'UpDownNatural', 'Para Cima e Para Baixo Natural', 15, 0)
ON DUPLICATE KEY UPDATE
  display_name = VALUES(display_name),
  cost_points = VALUES(cost_points),
  is_default = VALUES(is_default);
