CREATE TABLE `event` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` tinyint(4) NOT NULL,
  `date` datetime NOT NULL,
  `name` varchar(255) NOT NULL,
  `immutable` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `event_type_idx` (`type`),
  CONSTRAINT `event_ibfk_1` FOREIGN KEY (`type`) REFERENCES `eventType` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
