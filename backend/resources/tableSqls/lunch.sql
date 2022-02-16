CREATE TABLE `lunch` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event` int(11) NOT NULL,
  `pointsCost` double NOT NULL DEFAULT 0,
  `moneyCost` double NOT NULL DEFAULT 0,
  `vegetarianMoneyFactor` double NOT NULL DEFAULT 1,
  `participationFlatRate` double DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lunch_event_idx` (`event`),
  CONSTRAINT `lunch_ibfk_1` FOREIGN KEY (`event`) REFERENCES `event` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
