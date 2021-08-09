CREATE TABLE `transfer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event` int(11) NOT NULL,
  `sender` int(11) NOT NULL,
  `recipient` int(11) NOT NULL,
  `amount` double NOT NULL,
  `currency` tinyint(4) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transfer_event_idx` (`event`),
  KEY `transfer_sender_idx` (`sender`),
  KEY `transfer_recipient_idx` (`recipient`),
  CONSTRAINT `transfer_ibfk_1` FOREIGN KEY (`event`) REFERENCES `event` (`id`),
  CONSTRAINT `transfer_ibfk_2` FOREIGN KEY (`sender`) REFERENCES `user` (`id`),
  CONSTRAINT `transfer_ibfk_3` FOREIGN KEY (`recipient`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
