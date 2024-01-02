import org.apache.kafka.clients.producer.{KafkaProducer, ProducerConfig, ProducerRecord}
import org.mongodb.scala._
import java.util.{Date, Locale, Properties}
import org.mongodb.scala.bson.ObjectId
import org.mongodb.scala.model.Indexes
import java.text.{SimpleDateFormat}
import scala.concurrent.ExecutionContext.Implicits.global
import java.util.zip.{ ZipFile}
import java.io.{BufferedReader, InputStreamReader}
import scala.util.Random
import java.time.{ZonedDateTime}
import java.time.format.DateTimeFormatter

object ProducerKafka {

  def main(args: Array[String]): Unit = {

    // connection to mongodb
    val mongoClient: MongoClient = MongoClient("mongodb://localhost:27017")
    val database: MongoDatabase = mongoClient.getDatabase("admin")
    val collection: MongoCollection[Document] = database.getCollection("users")
    println("connect mongodb successfully...!")

    //create an index on the 'user' field in the 'users' collection
    collection.createIndex(Indexes.ascending("user")).toFuture().foreach { _ =>
      println("Index created on 'user' field.")
    }
    // Set up date formatting for parsing
    val dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
    dateFormat.setTimeZone(java.util.TimeZone.getTimeZone("UTC"))

    // Set up Kafka producer properties
    val properties = new Properties()
    properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092")
    properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer")
    properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer")
    properties.put("group.id", "use_a_separate_group_id_for_each_stream")
    properties.put("auto.offset.reset", "latest")
    properties.put("enable.auto.commit", java.lang.Boolean.FALSE)

    // Define the Kafka topic and create a Kafka producer
    val topic = "trainingDataTopic"
    val producer = new KafkaProducer[String, String](properties)

    // Open the zip file and read entries
    val zipFile = new ZipFile("src/main/resources/training.1600000.processed.noemoticon.csv - Copy.zip")
    val entries = zipFile.entries()

    // Process each entry
    while (entries.hasMoreElements) {
      val entry = entries.nextElement()
      val inputStream = zipFile.getInputStream(entry)
      val reader = new BufferedReader(new InputStreamReader(inputStream))

      var i = 1
      var line: String = null

      while ( {
        line = reader.readLine(); line != null
      }) {
        try {
          if (i % 1000 != 0) {

            // Parse attributes from CSV and retrieve the 'published_at' date
            val attributeDetails = line.replace("'", "\"").split(',')
            val publishedAt = try {
              dateFormat.parse(attributeDetails(7))
            } catch {
              case _: Exception => new Date()
            }
            // Parse the date from attributeDetails(2) using DateTimeFormatter
            val dateString = attributeDetails(2).replaceAll("^\"|\"$", "")
            val dateFormatter = DateTimeFormatter.ofPattern("EEE MMM dd HH:mm:ss zzz uuuu", Locale.ENGLISH)
            val zonedDateTime = ZonedDateTime.parse(dateString, dateFormatter)
            val theDate = Date.from(zonedDateTime.toInstant)

            // Create a mongodb document with tweet details and insert it into the collection
            val tweetDocument = Document(
              "_id" -> new ObjectId(),
              "id" -> attributeDetails(1),
              "date" -> theDate,
              "user" -> attributeDetails(4),
              "text" -> attributeDetails(5),
              "retweets" -> Random.nextInt(6),
              "published_at" -> publishedAt
            )
            collection.insertOne(tweetDocument).toFuture()
            println("Data inserted into mongodb successfully...! ")

            // Prepare tweet data for Kafka and send it as a JSON string
            val tweet = Map(
              "id" -> attributeDetails(1),
              "date" -> theDate,
              "user" -> attributeDetails(4),
              "text" -> attributeDetails(5),
              "retweets" -> Random.nextInt(10)
            )
            val tweetJson = tweet.toString()

            val record = new ProducerRecord[String, String](topic, null, tweetJson)
            producer.send(record)
          } else {

            Thread.sleep(1000) //Sleep for each 1 second
          }
          i += 1
        } catch {
          case e: Exception => e.printStackTrace()
        }
      }
      reader.close()
      inputStream.close()
    }
    // Close Kafka producer, zip file, mongodb connection
    producer.close()
    zipFile.close()
    mongoClient.close()
  }
}


