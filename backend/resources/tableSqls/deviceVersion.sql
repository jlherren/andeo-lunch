CREATE TABLE `deviceVersion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `version` varchar(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `lastSeen` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deviceVersion_device_idx` (`device`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
