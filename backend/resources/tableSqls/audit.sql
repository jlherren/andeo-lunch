CREATE TABLE `audit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL,
  `type` varchar(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `actingUser` int(11) NOT NULL,
  `event` int(11) DEFAULT NULL,
  `grocery` int(11) DEFAULT NULL,
  `affectedUser` int(11) DEFAULT NULL,
  `values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_actingUser_idx` (`actingUser`),
  KEY `audit_event_idx` (`event`),
  KEY `audit_affectedUser_idx` (`affectedUser`),
  KEY `audit_grocery_idx` (`grocery`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
