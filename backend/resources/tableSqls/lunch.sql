CREATE TABLE `lunch` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event` int(11) NOT NULL,
  `pointsCost` double NOT NULL DEFAULT 0,
  `moneyCost` double NOT NULL DEFAULT 0,
  `vegetarianMoneyFactor` double NOT NULL DEFAULT 1,
  `participationFlatRate` double DEFAULT NULL,
  `participationFee` double NOT NULL DEFAULT 0,
  `participationFeeRecipient` int(11) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lunch_event_idx` (`event`),
  KEY `lunch_participationFeeRecipient_idx` (`participationFeeRecipient`),
  CONSTRAINT `lunch_ibfk_1` FOREIGN KEY (`event`) REFERENCES `event` (`id`),
  CONSTRAINT `lunch_ibfk_2` FOREIGN KEY (`participationFeeRecipient`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
