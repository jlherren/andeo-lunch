CREATE TABLE `participation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event` int(11) NOT NULL,
  `user` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `pointsCredited` double NOT NULL DEFAULT 0,
  `moneyCredited` double NOT NULL DEFAULT 0,
  `moneyFactor` double NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `participation_userEvent_idx` (`user`,`event`),
  KEY `participation_event_idx` (`event`),
  KEY `participation_type_idx` (`type`),
  CONSTRAINT `participation_ibfk_1` FOREIGN KEY (`event`) REFERENCES `event` (`id`),
  CONSTRAINT `participation_ibfk_2` FOREIGN KEY (`user`) REFERENCES `user` (`id`),
  CONSTRAINT `participation_ibfk_3` FOREIGN KEY (`type`) REFERENCES `participationType` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
